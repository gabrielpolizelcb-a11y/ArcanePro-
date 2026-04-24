"""
ARCANE CORE API — main.py
FastAPI backend para o Arcane Pro.

Rotas:
  GET  /api/health                      → healthcheck
  POST /modulos/financeiro/analisar     → upload CSV
  POST /modulos/juridico/analisar       → upload PDF
  POST /modulos/rh/analisar             → upload CSV
  POST /modulos/marketing/analisar      → upload CSV
  POST /modulos/texto/gerar             → geração de texto (sem upload)
  POST /webhooks/kirvano                → recebe eventos de pagamento
"""

import os
import io
import re
import json
import hmac
import hashlib
from typing import Optional

import anthropic
import pandas as pd
import fitz  # pymupdf
from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Header, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ─────────────────────────────────────────
# Config
# ─────────────────────────────────────────
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "*"  # troque em produção para seu domínio, ex: "https://arcane.app,https://www.arcane.app"
).split(",")
KIRVANO_WEBHOOK_TOKEN = os.environ.get("KIRVANO_WEBHOOK_TOKEN", "")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")  # service_role (NÃO anon) para o webhook

# ─────────────────────────────────────────
# App
# ─────────────────────────────────────────
app = FastAPI(title="Arcane Core API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Clientes
claude_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def get_supabase_admin() -> Optional[Client]:
    """Cliente com service_role — só usar no servidor, nunca expor."""
    if SUPABASE_URL and SUPABASE_SERVICE_KEY:
        return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return None


# ─────────────────────────────────────────
# Utils
# ─────────────────────────────────────────
def extrair_json(texto: str) -> dict:
    """Extrai JSON da resposta da IA."""
    texto = texto.strip()
    match = re.search(r'\{.*\}', texto, re.DOTALL)
    if not match:
        raise ValueError(f"Nenhum JSON encontrado: {texto[:200]}")
    return json.loads(match.group())


def chamar_claude(system: str, user_content: str, max_tokens: int = 1200, temperature: float = 0.3) -> str:
    """Wrapper padrão para chamar Claude."""
    resposta = claude_client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system,
        messages=[{"role": "user", "content": user_content}]
    )
    return resposta.content[0].text


# ─────────────────────────────────────────
# Health
# ─────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "model": ANTHROPIC_MODEL}


# ─────────────────────────────────────────
# MÓDULO 1 — FINANCEIRO (CSV)
# ─────────────────────────────────────────
@app.post("/modulos/financeiro/analisar")
async def analisar_financeiro(arquivo: UploadFile = File(...)):
    if not arquivo.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Envie um arquivo CSV.")
    try:
        contents = await arquivo.read()
        df = pd.read_csv(io.BytesIO(contents))
        df.columns = df.columns.str.lower()

        if 'tipo' not in df.columns or 'valor' not in df.columns:
            raise HTTPException(status_code=400, detail="CSV precisa ter colunas 'tipo' e 'valor'.")

        receitas = df[df['tipo'].str.lower() == 'receita']['valor'].sum()
        despesas = df[df['tipo'].str.lower() == 'despesa']['valor'].sum()
        lucro = receitas - despesas

        gastos_por_categoria = {}
        if 'categoria' in df.columns:
            gastos_por_categoria = (
                df[df['tipo'].str.lower() == 'despesa']
                .groupby('categoria')['valor'].sum().to_dict()
            )

        dados = {
            "receita_total": float(receitas),
            "despesa_total": float(despesas),
            "resultado_liquido": float(lucro),
            "detalhamento_gastos": gastos_por_categoria,
        }

        system = """Você é o Arcane, consultor financeiro sênior.
Responda SOMENTE com JSON, sem texto fora dele, sem markdown.
Estrutura obrigatória:
{"saude_financeira": "Boa" ou "Razoavel" ou "Perigosa", "maior_ofensor": "categoria", "diagnostico": "até 3 parágrafos"}"""

        texto = chamar_claude(system, f"Dados: {json.dumps(dados, ensure_ascii=False)}", max_tokens=800, temperature=0.2)

        return {
            "status": "sucesso",
            "modulo": "financeiro",
            "dados_processados": dados,
            "analise_arcane": extrair_json(texto),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")


# ─────────────────────────────────────────
# MÓDULO 2 — JURÍDICO (PDF)
# ─────────────────────────────────────────
@app.post("/modulos/juridico/analisar")
async def analisar_contrato(arquivo: UploadFile = File(...)):
    if not arquivo.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Envie um arquivo PDF.")
    try:
        contents = await arquivo.read()
        doc = fitz.open(stream=contents, filetype="pdf")

        texto_completo = ""
        for pagina in doc:
            texto_completo += pagina.get_text()

        texto_resumido = texto_completo[:6000]
        total_paginas = doc.page_count

        system = """Você é o Arcane, especialista jurídico corporativo sênior.
Responda SOMENTE com JSON, sem texto fora dele, sem markdown.
Estrutura obrigatória:
{
  "nivel_risco": "Baixo" ou "Medio" ou "Alto",
  "clausulas_abusivas": ["lista de cláusulas problemáticas encontradas"],
  "pontos_atencao": ["lista de pontos que o empresário deve negociar"],
  "resumo_executivo": "resumo direto do contrato em 2 parágrafos"
}"""

        texto = chamar_claude(
            system,
            f"Analise este contrato ({total_paginas} páginas). Texto:\n\n{texto_resumido}",
            max_tokens=1200,
            temperature=0.1,
        )

        return {
            "status": "sucesso",
            "modulo": "juridico",
            "paginas_analisadas": total_paginas,
            "analise_arcane": extrair_json(texto),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")


# ─────────────────────────────────────────
# MÓDULO 3 — RH & GESTÃO (CSV)
# ─────────────────────────────────────────
@app.post("/modulos/rh/analisar")
async def analisar_rh(arquivo: UploadFile = File(...)):
    if not arquivo.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Envie um arquivo CSV.")
    try:
        contents = await arquivo.read()
        df = pd.read_csv(io.BytesIO(contents))
        df.columns = df.columns.str.lower()

        total_funcionarios = len(df)
        media_performance = round(df['performance'].mean(), 2) if 'performance' in df.columns else None
        media_absenteismo = round(df['absenteismo_dias'].mean(), 2) if 'absenteismo_dias' in df.columns else None
        top_performer = df.loc[df['performance'].idxmax(), 'nome'] if 'performance' in df.columns and 'nome' in df.columns else None
        critico = df.loc[df['performance'].idxmin(), 'nome'] if 'performance' in df.columns and 'nome' in df.columns else None

        dados = {
            "total_funcionarios": total_funcionarios,
            "media_performance": media_performance,
            "media_absenteismo_dias": media_absenteismo,
            "melhor_colaborador": top_performer,
            "colaborador_critico": critico,
            "colunas_disponiveis": list(df.columns),
        }

        system = """Você é o Arcane, especialista em RH e gestão de pessoas.
Responda SOMENTE com JSON, sem texto fora dele, sem markdown.
Estrutura obrigatória:
{
  "saude_equipe": "Saudavel" ou "Atencao" ou "Critica",
  "maior_problema": "descrição do principal problema identificado",
  "pdi_sugerido": ["ação 1 para melhorar a equipe", "ação 2", "ação 3"],
  "diagnostico": "análise consultiva em até 2 parágrafos"
}"""

        texto = chamar_claude(system, f"Métricas da equipe: {json.dumps(dados, ensure_ascii=False)}", max_tokens=800, temperature=0.2)

        return {
            "status": "sucesso",
            "modulo": "rh",
            "dados_processados": dados,
            "analise_arcane": extrair_json(texto),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")


# ─────────────────────────────────────────
# MÓDULO 4 — MARKETING (CSV)
# ─────────────────────────────────────────
@app.post("/modulos/marketing/analisar")
async def analisar_marketing(arquivo: UploadFile = File(...)):
    if not arquivo.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Envie um arquivo CSV.")
    try:
        contents = await arquivo.read()
        df = pd.read_csv(io.BytesIO(contents))
        df.columns = df.columns.str.lower()

        metricas = {}
        if 'gasto' in df.columns and 'conversoes' in df.columns:
            total_gasto = float(df['gasto'].sum())
            total_conversoes = int(df['conversoes'].sum())
            cpa = round(total_gasto / total_conversoes, 2) if total_conversoes > 0 else None
            metricas = {
                "total_investido": total_gasto,
                "total_conversoes": total_conversoes,
                "custo_por_aquisicao": cpa,
            }
        if 'impressoes' in df.columns and 'cliques' in df.columns:
            impressoes_sum = df['impressoes'].sum()
            if impressoes_sum > 0:
                metricas["ctr_medio"] = round((df['cliques'].sum() / impressoes_sum) * 100, 2)
        if 'campanha' in df.columns:
            metricas["campanhas_analisadas"] = int(df['campanha'].nunique())

        system = """Você é o Arcane, especialista em marketing digital e performance.
Responda SOMENTE com JSON, sem texto fora dele, sem markdown.
Estrutura obrigatória:
{
  "performance_geral": "Otima" ou "Regular" ou "Ruim",
  "campanha_problema": "nome ou descrição da campanha com pior resultado",
  "acoes_imediatas": ["ação 1", "ação 2", "ação 3"],
  "diagnostico": "análise consultiva em até 2 parágrafos"
}"""

        texto = chamar_claude(system, f"Métricas de marketing: {json.dumps(metricas, ensure_ascii=False)}", max_tokens=800, temperature=0.2)

        return {
            "status": "sucesso",
            "modulo": "marketing",
            "dados_processados": metricas,
            "analise_arcane": extrair_json(texto),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")


# ─────────────────────────────────────────
# MÓDULO 5 — TEXTO GENÉRICO (sem upload)
# Atende: gerar contrato, NDA, copy de vendas, posts, proposta comercial,
# e-mail, ata, descrição de vaga, política interna, estratégia de conteúdo,
# projeção de cenários, diagnóstico sem dados etc.
# ─────────────────────────────────────────
class GerarTextoPayload(BaseModel):
    tool: str                      # id da ferramenta, ex: "gerar_contrato"
    module: Optional[str] = None   # id do módulo, ex: "juridico"
    input: str                     # contexto fornecido pelo usuário
    file_content: Optional[str] = None   # texto opcional (quando o frontend leu o arquivo)
    file_name: Optional[str] = None
    company_name: Optional[str] = None
    sector: Optional[str] = None
    company_size: Optional[str] = None
    tone: Optional[str] = None
    city: Optional[str] = None


TOOL_PROMPTS = {
    # Financeiro
    "fluxo_caixa_diagnostico": "Diagnostique o fluxo de caixa da empresa. Identifique riscos, gaps, sazonalidades e recomende ações concretas de curto prazo.",
    "identificar_desperdicio": "Identifique desperdícios financeiros e operacionais no negócio descrito. Liste onde há perda de dinheiro e como corrigir.",
    "projecao_cenarios": "Monte 3 cenários de projeção financeira para 6 meses: pessimista, realista e otimista. Quantifique quando possível.",
    # Jurídico
    "gerar_contrato": "Gere um contrato profissional, juridicamente robusto, bem estruturado por cláusulas, conforme a legislação brasileira. Inclua objeto, obrigações, prazo, valor, foro, LGPD e rescisão.",
    "lgpd_diagnostico": "Faça um diagnóstico de conformidade LGPD do negócio. Aponte nível de conformidade atual, principais gaps e plano de adequação em etapas.",
    "nda": "Gere um Acordo de Confidencialidade (NDA) robusto, com definição de informação confidencial, prazo, obrigações, penalidades e foro, conforme a legislação brasileira.",
    # RH
    "diagnostico_time": "Diagnostique o time descrito. Identifique riscos de retenção, gaps de competência, pontos fortes e apresente plano de ação em 90 dias.",
    "descricao_vaga": "Crie uma descrição de vaga completa e atraente: responsabilidades, requisitos obrigatórios, diferenciais, benefícios e faixa salarial sugerida (se aplicável).",
    "avaliacao_desempenho": "Gere um formulário estruturado de avaliação de desempenho com metas SMART, competências comportamentais e técnicas, escala de notas e plano de desenvolvimento.",
    "plano_onboarding": "Monte um plano de onboarding completo de 30/60/90 dias com marcos, treinamentos e checkpoints.",
    "politica_interna": "Crie uma política interna formal com escopo, diretrizes, responsabilidades, consequências e controle de versão.",
    # Marketing
    "diagnostico_marketing": "Diagnostique o marketing atual descrito. Aponte gaps, oportunidades e entregue uma estratégia de 90 dias com prioridades.",
    "estrategia_conteudo": "Monte um plano editorial de 30 dias por canal (Instagram, LinkedIn, Blog, E-mail), com temas, formatos e frequência.",
    "copy_vendas": "Escreva uma copy de vendas persuasiva (modelo AIDA ou PAS), com headline, subheadline, dores, solução, prova social, oferta e CTA.",
    "post_redes_sociais": "Gere 5 posts prontos para LinkedIn, Instagram e WhatsApp, cada um adaptado ao canal, com CTA claro.",
    # Operações
    "diagnostico_processos": "Diagnostique os processos descritos. Mapeie gargalos, desperdícios, pontos de automação e proponha o processo ideal (as-is vs to-be).",
    "proposta_comercial": "Gere uma proposta comercial consultiva: contexto do cliente, diagnóstico, solução, escopo, entregáveis, cronograma, investimento, garantias e próximos passos.",
    "ata_reuniao": "Redija uma ata de reunião profissional: participantes, pauta, decisões tomadas, tarefas com responsáveis e prazos, próximos passos.",
    "email_profissional": "Redija um e-mail profissional claro, direto e educado conforme o contexto fornecido. Mantenha o tom apropriado.",
    # Consultoria
    "diagnostico_completo": "Faça um diagnóstico 360° do negócio cobrindo financeiro, comercial, operações, pessoas e marketing. Priorize problemas e entregue roteiro de 90 dias.",
    "plano_crescimento": "Crie um plano de crescimento para dobrar o negócio em 12 meses: metas, canais de aquisição, operações, time, investimentos e riscos.",
    "analise_concorrentes": "Monte uma análise de concorrentes (até 3): posicionamento, preço, oferta, força, fraqueza e oportunidades de diferenciação.",
    # Upload de planilha / extrato (quando o usuário optou por enviar texto colado em vez de upload)
    "analisar_planilha": "Analise os dados financeiros fornecidos. Identifique receita, despesas, margem, tendências e entregue diagnóstico com 3 ações prioritárias.",
    "revisar_contrato": "Revise o contrato fornecido. Aponte cláusulas abusivas, pontos de atenção e sugestões de renegociação por cláusula.",
}


@app.post("/modulos/texto/gerar")
async def gerar_texto(payload: GerarTextoPayload):
    """Rota genérica para ferramentas de geração de texto (sem upload de arquivo binário)."""
    try:
        instrucao_tool = TOOL_PROMPTS.get(payload.tool, "Atenda ao pedido do usuário com profundidade consultiva.")

        contexto_empresa = []
        if payload.company_name: contexto_empresa.append(f"Empresa: {payload.company_name}")
        if payload.sector:       contexto_empresa.append(f"Setor: {payload.sector}")
        if payload.company_size: contexto_empresa.append(f"Porte: {payload.company_size}")
        if payload.city:         contexto_empresa.append(f"Cidade: {payload.city}")
        tone = payload.tone or "Neutro e profissional"

        system = f"""Você é o Arcane, consultor empresarial sênior com expertise em finanças, jurídico, RH, marketing, operações e estratégia.
Tom de voz desta resposta: {tone}.
Responda sempre em português do Brasil, de forma direta, profissional, acionável e estruturada em seções com títulos.
Evite jargão vazio e blocos genéricos — entregue recomendações específicas e aplicáveis ao contexto recebido."""

        partes_user = [f"TAREFA: {instrucao_tool}"]
        if contexto_empresa:
            partes_user.append("CONTEXTO DA EMPRESA:\n" + "\n".join(contexto_empresa))
        if payload.input:
            partes_user.append(f"CONTEXTO FORNECIDO PELO USUÁRIO:\n{payload.input}")
        if payload.file_content:
            # limita para não explodir tokens
            conteudo = payload.file_content[:8000]
            partes_user.append(f"CONTEÚDO DO ARQUIVO ({payload.file_name or 'arquivo'}):\n{conteudo}")

        user_content = "\n\n".join(partes_user)

        texto = chamar_claude(system, user_content, max_tokens=1800, temperature=0.4)

        return {
            "status": "sucesso",
            "tool": payload.tool,
            "result": texto,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")


# ─────────────────────────────────────────
# WEBHOOK — KIRVANO
# ─────────────────────────────────────────
# Mapa produto Kirvano → plano no Supabase.
# Preencha com os IDs reais dos produtos depois de criar na Kirvano.
KIRVANO_PRODUCT_MAP = {
    # "id-do-produto-na-kirvano": "essencial",
    # "id-do-produto-na-kirvano": "profissional",
    # "id-do-produto-na-kirvano": "gestao",
}
# Alternativa: mapear por nome do produto (menos robusto, mas útil em bootstrap)
KIRVANO_PRODUCT_NAME_MAP = {
    "arcane essencial": "essencial",
    "arcane profissional": "profissional",
    "arcane gestão": "gestao",
    "arcane gestao": "gestao",
}


def resolver_plano(products: list) -> Optional[str]:
    """Dado o array products do webhook, devolve o id do plano interno."""
    for p in products or []:
        pid = p.get("id")
        if pid and pid in KIRVANO_PRODUCT_MAP:
            return KIRVANO_PRODUCT_MAP[pid]
        pname = (p.get("name") or "").strip().lower()
        if pname in KIRVANO_PRODUCT_NAME_MAP:
            return KIRVANO_PRODUCT_NAME_MAP[pname]
    return None


@app.post("/webhooks/kirvano")
async def webhook_kirvano(
    request: Request,
    x_kirvano_token: Optional[str] = Header(None, alias="X-Kirvano-Token"),
):
    """
    Recebe eventos da Kirvano e atualiza o plano do usuário no Supabase.
    Configure na Kirvano:
      - URL da integração: https://SEU-BACKEND/webhooks/kirvano
      - Token: o valor de KIRVANO_WEBHOOK_TOKEN (env var)
    Eventos tratados:
      - SALE_APPROVED → promove usuário ao plano
      - SUBSCRIPTION_CANCELED / SUBSCRIPTION_EXPIRED / REFUNDED → volta para free
    """
    # 1) Validação de token
    if KIRVANO_WEBHOOK_TOKEN:
        # Kirvano manda o token que você configurou. Aceitamos via header ou query.
        token_query = request.query_params.get("token", "")
        token_received = x_kirvano_token or token_query
        if token_received != KIRVANO_WEBHOOK_TOKEN:
            raise HTTPException(status_code=401, detail="Token inválido.")

    # 2) Parse
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Payload inválido.")

    event = payload.get("event")
    customer = payload.get("customer") or {}
    email = (customer.get("email") or "").strip().lower()
    products = payload.get("products") or []

    if not email:
        raise HTTPException(status_code=400, detail="E-mail do comprador ausente.")

    # 3) Só age em eventos relevantes
    ATIVA = {"SALE_APPROVED"}
    CANCELA = {"SUBSCRIPTION_CANCELED", "SUBSCRIPTION_EXPIRED", "REFUNDED", "CHARGEBACK"}

    if event not in ATIVA and event not in CANCELA:
        # registra e ignora (pix_gerado, boleto_gerado, etc.)
        return {"status": "ignored", "event": event}

    supa = get_supabase_admin()
    if not supa:
        raise HTTPException(status_code=500, detail="Supabase admin não configurado no servidor.")

    # 4) Descobre usuário pelo e-mail
    #    IMPORTANTE: a tabela profiles precisa ter coluna `email` espelhando o auth.users.email,
    #    preenchida na criação do perfil. O schema SQL incluso já cuida disso.
    try:
        res = supa.table("profiles").select("id, email, plan").eq("email", email).limit(1).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro Supabase: {str(e)}")

    if not res.data:
        # Usuário ainda não existe na plataforma — guarda a venda pendente
        try:
            supa.table("pending_subscriptions").insert({
                "email": email,
                "event": event,
                "sale_id": payload.get("sale_id"),
                "raw_payload": payload,
            }).execute()
        except Exception:
            pass
        return {"status": "pending", "reason": "user_not_found", "email": email}

    user_row = res.data[0]

    # 5) Atualiza o plano
    if event in ATIVA:
        plano = resolver_plano(products)
        if not plano:
            return {"status": "warning", "reason": "produto_nao_mapeado", "products": [p.get("id") or p.get("name") for p in products]}
        supa.table("profiles").update({"plan": plano}).eq("id", user_row["id"]).execute()
        # log da transação
        try:
            supa.table("subscription_events").insert({
                "user_id": user_row["id"],
                "email": email,
                "event": event,
                "sale_id": payload.get("sale_id"),
                "plan": plano,
                "raw_payload": payload,
            }).execute()
        except Exception:
            pass
        return {"status": "ok", "action": "plan_upgraded", "plan": plano}

    if event in CANCELA:
        supa.table("profiles").update({"plan": "free"}).eq("id", user_row["id"]).execute()
        try:
            supa.table("subscription_events").insert({
                "user_id": user_row["id"],
                "email": email,
                "event": event,
                "sale_id": payload.get("sale_id"),
                "plan": "free",
                "raw_payload": payload,
            }).execute()
        except Exception:
            pass
        return {"status": "ok", "action": "plan_downgraded"}
