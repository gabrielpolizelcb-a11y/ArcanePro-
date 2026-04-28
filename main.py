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
  POST /modulos/arcane-teste/analisar   → análise freemium com paywall
  GET  /modulos/arcane-teste/analise/{id} → busca análise (preview ou completo)
  POST /webhooks/kirvano                → recebe eventos de pagamento
"""

import os
import io
import re
import json
import hmac
import hashlib
from typing import Optional, List

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
app = FastAPI(title="Arcane Core API", version="1.2.0")

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
# ─────────────────────────────────────────
class GerarTextoPayload(BaseModel):
    tool: str
    module: Optional[str] = None
    input: str
    file_content: Optional[str] = None
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
# MÓDULO ARCANE TESTE — Análise freemium com paywall
# ─────────────────────────────────────────
class ArcaneTesteRequest(BaseModel):
    """Mantido por compatibilidade. A rota agora usa Form/UploadFile."""
    user_id: str
    setor: str
    funcionarios: str
    faturamento: str
    areas: List[str]
    descricao: str
    objetivos: List[str]


# ─────────────────────────────────────────
# Helper — extrair texto de arquivo enviado (CSV, Excel, PDF)
# ─────────────────────────────────────────
def extrair_texto_arquivo(arquivo: UploadFile, contents: bytes) -> str:
    """
    Tenta extrair texto/dados do arquivo enviado.
    Retorna string formatada pra incluir no contexto do Claude.
    Em caso de erro, retorna mensagem indicando que falhou (não levanta exceção).
    """
    nome = (arquivo.filename or "").lower()
    try:
        if nome.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
            # Limita a 50 linhas pra não estourar tokens
            preview = df.head(50).to_string(index=False)
            resumo = f"CSV com {len(df)} linhas e colunas: {list(df.columns)}\n\nPrimeiras linhas:\n{preview}"
            return resumo[:4000]

        elif nome.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
            preview = df.head(50).to_string(index=False)
            resumo = f"Excel com {len(df)} linhas e colunas: {list(df.columns)}\n\nPrimeiras linhas:\n{preview}"
            return resumo[:4000]

        elif nome.endswith(".pdf"):
            doc = fitz.open(stream=contents, filetype="pdf")
            texto = "\n".join(page.get_text() for page in doc)
            doc.close()
            if not texto.strip():
                return "[PDF enviado mas sem texto extraível — pode ser imagem/scan]"
            return texto[:4000]

        else:
            return f"[Formato não suportado: {nome}]"

    except Exception as e:
        return f"[Erro ao ler arquivo {nome}: {str(e)[:200]}]"


@app.post("/modulos/arcane-teste/analisar")
async def analisar_arcane_teste(
    user_id: str = Form(...),
    setor: str = Form(...),
    funcionarios: str = Form(...),
    faturamento: str = Form(...),
    areas: str = Form(...),         # JSON-encoded list
    descricao: str = Form(...),
    objetivos: str = Form(...),     # JSON-encoded list
    arquivo: Optional[UploadFile] = File(None),
):
    """
    Recebe dados estruturados do wizard (+ arquivo opcional) e gera análise completa via Claude.
    Limita a 3 análises grátis por usuário (verificado em profiles.arcane_teste_used).
    Salva no Supabase e retorna a análise inteira (sem paywall).
    """
    LIMITE_FREE = 3

    try:
        # ─── Decode listas JSON enviadas como string ───
        try:
            areas_list = json.loads(areas) if isinstance(areas, str) else areas
            objetivos_list = json.loads(objetivos) if isinstance(objetivos, str) else objetivos
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Campos 'areas' e 'objetivos' precisam ser JSON válido.")

        # ─── Cliente Supabase admin ───
        supa = get_supabase_admin()
        if not supa:
            raise HTTPException(status_code=500, detail="Supabase admin não configurado.")

        # ─── Verificar limite de gerações (3 grátis) ───
        prof_resp = supa.table("profiles").select("arcane_teste_used, plan").eq("id", user_id).limit(1).execute()
        if prof_resp.data and len(prof_resp.data) > 0:
            prof_row = prof_resp.data[0]
            usado = prof_row.get("arcane_teste_used") or 0
            plano_atual = prof_row.get("plan") or "free"
            # Usuários pagos não têm limite no Arcane Teste
            if plano_atual == "free" and usado >= LIMITE_FREE:
                raise HTTPException(
                    status_code=403,
                    detail=f"Você já usou suas {LIMITE_FREE} análises gratuitas. Assine um plano para continuar."
                )
        else:
            usado = 0

        # ─── Mapeia áreas pra nomes legíveis ───
        AREA_LABELS = {
            'fin': 'Financeiro', 'rh': 'RH e Pessoas', 'mkt': 'Marketing e Vendas',
            'ops': 'Operações', 'jur': 'Jurídico', 'est': 'Estratégia'
        }
        areas_nomes = [AREA_LABELS.get(a, a) for a in areas_list]

        # ─── Processa arquivo se enviado ───
        contexto_arquivo = ""
        nome_arquivo = None
        if arquivo and arquivo.filename:
            contents = await arquivo.read()
            if len(contents) > 0:
                nome_arquivo = arquivo.filename
                texto_arquivo = extrair_texto_arquivo(arquivo, contents)
                contexto_arquivo = f"\n\nDADOS DO ARQUIVO ENVIADO ({nome_arquivo}):\n{texto_arquivo}"

        # ─── Contexto formatado pra IA ───
        contexto = f"""DADOS DA EMPRESA:
- Setor: {setor}
- Funcionários: {funcionarios}
- Faturamento mensal: {faturamento}
- Áreas com problema: {', '.join(areas_nomes)}
- Objetivos da análise: {', '.join(objetivos_list)}

DESCRIÇÃO DA SITUAÇÃO (palavras do empresário):
{descricao}{contexto_arquivo}"""

        # ─── ANÁLISE COMPLETA (sem paywall, entrega tudo) ───
        system_prompt = """Você é o Arcane, consultor empresarial sênior brasileiro com tom direto e objetivo. Sem enrolação. Foco em ação.

Você está gerando uma ANÁLISE COMPLETA do negócio. Estruture em 4 seções:

## 1. DIAGNÓSTICO
- Análise profunda da situação descrita
- Causas-raiz identificadas
- Riscos específicos se nada for feito
- Se houver dados de arquivo (CSV/Excel/PDF), use-os pra dar números concretos

## 2. PLANO DE AÇÃO (5-7 ações concretas)
- Cada ação numerada com o QUE fazer e COMO fazer
- Priorize por impacto x esforço
- Inclua prazos sugeridos (essa semana, esse mês, próximos 90 dias)

## 3. ESTIMATIVA DE IMPACTO
- Quanto pode economizar/ganhar em R$ aplicando o plano
- Em qual prazo
- Use os dados do arquivo se houver, senão use benchmarks do setor

## 4. PRÓXIMOS PASSOS
- Por onde começar essa semana
- Quais decisões precisa tomar primeiro
- Quem precisa estar envolvido

REGRAS:
- Tom direto, sem clichês de consultor ("é importante notar", "vale ressaltar", "diante do exposto")
- Use números, prazos e nomes específicos quando possível
- Linguagem do dono de pequeno negócio brasileiro
- Use markdown simples (## para títulos das 4 seções, números pra ações)
- Não termine com "espero ter ajudado" ou despedidas — termine com a última ação prática"""

        analise_text = chamar_claude(system_prompt, contexto, max_tokens=3500, temperature=0.4).strip()

        # ─── Salva no Supabase ───
        result = supa.table("arcane_teste_analyses").insert({
            "user_id": user_id,
            "setor": setor,
            "funcionarios": funcionarios,
            "faturamento": faturamento,
            "areas": areas_list,
            "descricao": descricao,
            "objetivos": objetivos_list,
            "preview": analise_text,        # mantemos a coluna pra compat, mas com a análise completa
            "completo": analise_text,
            "unlocked": True,               # sempre desbloqueado agora
        }).execute()

        analysis_id = result.data[0]["id"] if result.data else None

        # ─── Incrementa contador ───
        novo_contador = usado + 1
        supa.table("profiles").update({"arcane_teste_used": novo_contador}).eq("id", user_id).execute()

        # ─── Retorna análise completa ───
        return {
            "status": "sucesso",
            "analysis_id": analysis_id,
            "analise": analise_text,
            "arcane_teste_used": novo_contador,
            "limite_free": LIMITE_FREE,
        }

    except HTTPException:
        raise
    except Exception as e:
        # Loga o stack trace completo no Railway pra facilitar debug, mas retorna mensagem amigável
        import traceback
        print(f"[arcane-teste] ERRO: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar análise. Tente novamente em alguns segundos.")


# ─────────────────────────────────────────
# MÓDULO EMPRESA — Plano IA pra meta
# ─────────────────────────────────────────
class GerarPlanoMetaRequest(BaseModel):
    user_id: str
    meta_id: str
    titulo: str
    tipo: str
    valor_alvo: Optional[float] = None
    prazo: Optional[str] = None  # ISO date


@app.post("/modulos/empresa/meta/plano")
async def gerar_plano_meta(req: GerarPlanoMetaRequest):
    """
    Gera um plano de ação personalizado pra uma meta do cliente, usando contexto do perfil.
    Salva no campo plano_ia da tabela business_goals.
    """
    try:
        supa = get_supabase_admin()
        if not supa:
            raise HTTPException(status_code=500, detail="Supabase admin não configurado.")

        # ─── Pega contexto do perfil ───
        prof_resp = supa.table("profiles").select("company_name, sector, company_size, city").eq("id", req.user_id).limit(1).execute()
        prof = prof_resp.data[0] if (prof_resp.data and len(prof_resp.data) > 0) else {}

        # ─── Pega últimas 6 métricas pra dar contexto de números ───
        met_resp = supa.table("business_metrics").select("mes, faturamento, num_clientes, num_vendas, ticket_medio") \
            .eq("user_id", req.user_id).order("mes", desc=True).limit(6).execute()
        metricas = met_resp.data or []

        # ─── Monta o contexto ───
        contexto_empresa = f"""EMPRESA:
- Nome: {prof.get('company_name') or 'Não informado'}
- Setor: {prof.get('sector') or 'Não informado'}
- Tamanho: {prof.get('company_size') or 'Não informado'}
- Cidade: {prof.get('city') or 'Não informado'}"""

        contexto_metricas = ""
        if metricas:
            linhas = []
            for m in metricas:
                linhas.append(f"- {m.get('mes')}: faturamento R$ {m.get('faturamento') or 0:.2f}, "
                             f"{m.get('num_clientes') or 0} clientes, {m.get('num_vendas') or 0} vendas, "
                             f"ticket médio R$ {m.get('ticket_medio') or 0:.2f}")
            contexto_metricas = "\n\nMÉTRICAS RECENTES (últimos meses):\n" + "\n".join(linhas)
        else:
            contexto_metricas = "\n\n(Cliente ainda não lançou métricas mensais.)"

        contexto_meta = f"""

META DEFINIDA PELO CLIENTE:
- Título: {req.titulo}
- Tipo: {req.tipo}
- Valor alvo: {f'R$ {req.valor_alvo:.2f}' if req.valor_alvo else 'Não definido'}
- Prazo: {req.prazo or 'Não definido'}"""

        contexto_completo = contexto_empresa + contexto_metricas + contexto_meta

        # ─── Prompt ───
        system_prompt = """Você é o Arcane, consultor empresarial sênior brasileiro. Tom direto, sem enrolação.

Sua tarefa: gerar um PLANO DE AÇÃO específico e prático pra essa meta. Considere o contexto da empresa e as métricas atuais (se houver) pra ser realista.

ESTRUTURA OBRIGATÓRIA:

## Análise da meta
2-3 linhas dizendo se a meta é realista pro contexto, e qual o gap atual vs meta.

## Plano de ação (5-7 passos)
Cada passo numerado, com:
- O que fazer (verbo no infinitivo + objeto específico)
- Como fazer (1-2 frases concretas)
- Prazo sugerido

## Marcos de acompanhamento
3-4 checkpoints intermediários pra acompanhar progresso.

## Riscos
2-3 coisas que podem derrubar o plano e como mitigar.

REGRAS:
- Seja específico com números quando o cliente forneceu valor alvo
- Use a linguagem do dono de pequena empresa brasileiro
- Markdown simples (## pra títulos, números pra ações)
- Não termine com "boa sorte" ou despedidas
- Máximo 800 palavras"""

        plano_text = chamar_claude(system_prompt, contexto_completo, max_tokens=2500, temperature=0.4).strip()

        # ─── Salva no banco ───
        supa.table("business_goals").update({"plano_ia": plano_text}).eq("id", req.meta_id).eq("user_id", req.user_id).execute()

        return {
            "status": "sucesso",
            "meta_id": req.meta_id,
            "plano_ia": plano_text,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[empresa/meta/plano] ERRO: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Erro ao gerar plano. Tente novamente em alguns segundos.")


# ─────────────────────────────────────────
# MÓDULO EMPRESA — DRE Mensal via Upload (Profissional+)
# ─────────────────────────────────────────
@app.post("/modulos/empresa/dre/upload")
async def upload_dre(
    user_id: str = Form(...),
    mes: str = Form(...),                       # ISO date "YYYY-MM-01"
    arquivo: UploadFile = File(...),
):
    """
    Recebe um extrato/planilha/PDF e usa Claude para:
    1. Extrair lançamentos (data, descrição, valor)
    2. Classificar cada um em: receita, dedução, CMV, despesa operacional (com subcategoria), despesa financeira
    3. Calcular DRE estruturada
    4. Gerar alertas/insights
    Salva tudo em business_dre. Auto-preenche faturamento em business_metrics.
    Restrito a plano Profissional+ (validado server-side).
    """
    try:
        supa = get_supabase_admin()
        if not supa:
            raise HTTPException(status_code=500, detail="Supabase admin não configurado.")

        # ─── Verifica plano (Profissional+) ───
        prof_resp = supa.table("profiles").select("plan").eq("id", user_id).limit(1).execute()
        plano = "free"
        if prof_resp.data and len(prof_resp.data) > 0:
            plano = prof_resp.data[0].get("plan") or "free"
        if plano not in ("profissional", "gestao", "business", "unlimited"):
            raise HTTPException(
                status_code=403,
                detail="DRE com IA é exclusivo do plano Profissional+. Faça upgrade para usar."
            )

        # ─── Lê arquivo ───
        if not arquivo.filename:
            raise HTTPException(status_code=400, detail="Nenhum arquivo enviado.")
        contents = await arquivo.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Arquivo vazio.")

        texto_extraido = extrair_texto_arquivo(arquivo, contents)
        if texto_extraido.startswith("[") and "Erro" in texto_extraido:
            raise HTTPException(status_code=400, detail=f"Não foi possível ler o arquivo: {texto_extraido}")

        # ─── Pega contexto da empresa pra IA classificar melhor ───
        ctx_resp = supa.table("profiles").select("company_name, sector, company_size").eq("id", user_id).limit(1).execute()
        ctx = ctx_resp.data[0] if (ctx_resp.data and len(ctx_resp.data) > 0) else {}
        contexto_empresa = f"Empresa: {ctx.get('company_name','?')} · Setor: {ctx.get('sector','?')} · Tamanho: {ctx.get('company_size','?')}"

        # ─── Prompt: extrai DRE estruturada como JSON ───
        system_prompt = """Você é o Arcane, contador/analista financeiro brasileiro. Sua tarefa: ler movimentações financeiras (extrato bancário, planilha de vendas/despesas, ou PDF) e produzir uma DRE Mensal estruturada (Demonstração de Resultado do Exercício) no padrão brasileiro de pequenas empresas.

CLASSIFIQUE cada linha em UMA dessas categorias:
- "receita_bruta": vendas, serviços prestados, recebimentos de clientes
- "deducoes": impostos sobre vendas (Simples Nacional, ICMS, ISS, PIS/COFINS), devoluções, descontos concedidos
- "cmv": custo direto da mercadoria vendida ou serviço prestado (matéria-prima, mão-de-obra direta)
- "despesa_pessoal": salários, pró-labore, encargos, benefícios, FGTS
- "despesa_marketing": anúncios, agências, assessoria, eventos
- "despesa_administrativa": aluguel, água/luz, internet, contador, software, escritório, materiais
- "despesa_outras": qualquer despesa operacional que não cabe acima
- "despesa_financeira": juros, IOF, tarifas bancárias, multas, parcelamentos
- "ignorar": transferências entre contas próprias, aplicações, resgates (não impacta DRE)

REGRAS:
- Retorne APENAS um JSON válido (sem markdown, sem ```json, sem texto fora do JSON)
- Receitas são sempre POSITIVAS, todas as despesas/deduções são NEGATIVAS
- Calcule margens como decimal (0.45 = 45%)
- Se algum valor não for claro, faça melhor estimativa e mencione em "alertas"
- Se identificar inconsistência (ex: "despesa muito alta em pessoal pra empresa do tamanho informado"), inclua em "alertas"

ESTRUTURA EXATA do JSON de retorno:
{
  "receita_bruta": 0.00,
  "deducoes": 0.00,
  "receita_liquida": 0.00,
  "cmv": 0.00,
  "lucro_bruto": 0.00,
  "despesas_operacionais": {
    "pessoal": 0.00,
    "marketing": 0.00,
    "administrativo": 0.00,
    "outras": 0.00
  },
  "ebitda": 0.00,
  "despesas_financeiras": 0.00,
  "lucro_liquido": 0.00,
  "margem_bruta": 0.00,
  "margem_liquida": 0.00,
  "alertas": ["até 4 alertas curtos sobre pontos de atenção identificados"],
  "classificacoes": [
    {"descricao": "exemplo da linha", "valor": -100.00, "categoria": "despesa_administrativa"}
  ]
}

A lista "classificacoes" deve conter no máximo 30 linhas (as mais relevantes), pra economizar tokens."""

        user_content = f"""{contexto_empresa}

Mês de referência: {mes}

DADOS DO ARQUIVO ({arquivo.filename}):
{texto_extraido}

Gere a DRE estruturada como JSON conforme as regras."""

        resposta = chamar_claude(system_prompt, user_content, max_tokens=4000, temperature=0.2)

        # ─── Extrai JSON da resposta ───
        try:
            dre_data = extrair_json(resposta)
        except Exception as e:
            print(f"[empresa/dre/upload] JSON inválido: {resposta[:500]}")
            raise HTTPException(status_code=500, detail="A IA não retornou um JSON válido. Tente reenviar o arquivo.")

        # ─── Defesa: garante campos numéricos ───
        def _num(v, default=0):
            try: return float(v) if v is not None else default
            except: return default

        despesas_op = dre_data.get("despesas_operacionais") or {}
        receita_bruta   = _num(dre_data.get("receita_bruta"))
        deducoes        = _num(dre_data.get("deducoes"))
        receita_liquida = _num(dre_data.get("receita_liquida"))
        cmv             = _num(dre_data.get("cmv"))
        lucro_bruto     = _num(dre_data.get("lucro_bruto"))
        ebitda          = _num(dre_data.get("ebitda"))
        desp_fin        = _num(dre_data.get("despesas_financeiras"))
        lucro_liquido   = _num(dre_data.get("lucro_liquido"))
        margem_bruta    = _num(dre_data.get("margem_bruta"))
        margem_liquida  = _num(dre_data.get("margem_liquida"))
        alertas         = dre_data.get("alertas") or []
        classificacoes  = dre_data.get("classificacoes") or []

        # ─── Salva DRE (upsert manual: se já existe pra esse mês, atualiza) ───
        existing = supa.table("business_dre").select("id").eq("user_id", user_id).eq("mes", mes).limit(1).execute()
        record = {
            "user_id": user_id,
            "mes": mes,
            "arquivo_nome": arquivo.filename,
            "receita_bruta": receita_bruta,
            "deducoes": deducoes,
            "receita_liquida": receita_liquida,
            "cmv": cmv,
            "lucro_bruto": lucro_bruto,
            "despesas_operacionais": despesas_op,
            "ebitda": ebitda,
            "despesas_financeiras": desp_fin,
            "lucro_liquido": lucro_liquido,
            "margem_bruta": margem_bruta,
            "margem_liquida": margem_liquida,
            "alertas": alertas,
            "classificacoes_raw": classificacoes,
        }
        if existing.data and len(existing.data) > 0:
            dre_id = existing.data[0]["id"]
            supa.table("business_dre").update(record).eq("id", dre_id).execute()
        else:
            ins = supa.table("business_dre").insert(record).execute()
            dre_id = ins.data[0]["id"] if ins.data else None

        # ─── Auto-atualiza faturamento em business_metrics (se já existe linha do mês, atualiza só faturamento) ───
        try:
            metric_existing = supa.table("business_metrics").select("id, num_vendas").eq("user_id", user_id).eq("mes", mes).limit(1).execute()
            if metric_existing.data and len(metric_existing.data) > 0:
                # Atualiza só o faturamento (e recalcula ticket se tiver vendas registradas)
                vendas = metric_existing.data[0].get("num_vendas") or 0
                ticket = (receita_bruta / vendas) if vendas > 0 else 0
                supa.table("business_metrics").update({
                    "faturamento": receita_bruta,
                    "ticket_medio": ticket,
                }).eq("id", metric_existing.data[0]["id"]).execute()
            else:
                # Cria nova com só o faturamento
                supa.table("business_metrics").insert({
                    "user_id": user_id, "mes": mes,
                    "faturamento": receita_bruta,
                    "num_clientes": 0, "num_vendas": 0, "ticket_medio": 0,
                }).execute()
        except Exception as sync_err:
            print(f"[empresa/dre/upload] Aviso: falha ao sincronizar metrics: {sync_err}")

        return {
            "status": "sucesso",
            "dre_id": dre_id,
            "dre": record,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[empresa/dre/upload] ERRO: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Erro ao processar DRE. Tente novamente em alguns segundos.")


@app.get("/modulos/arcane-teste/analise/{analysis_id}")
async def buscar_analise(analysis_id: str, user_id: str):
    """
    Busca uma análise. Se unlocked=True, retorna preview+completo.
    Se False, retorna só preview.
    """
    try:
        supa = get_supabase_admin()
        if not supa:
            raise HTTPException(status_code=500, detail="Supabase admin não configurado.")

        result = supa.table("arcane_teste_analyses") \
            .select("*") \
            .eq("id", analysis_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Análise não encontrada")

        data = result.data
        return {
            "status": "sucesso",
            "analysis_id": data["id"],
            "preview": data["preview"],
            "completo": data["completo"] if data["unlocked"] else None,
            "unlocked": data["unlocked"],
            "created_at": data["created_at"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")


# ─────────────────────────────────────────
# WEBHOOK — KIRVANO
# ─────────────────────────────────────────
KIRVANO_PRODUCT_MAP = {
    # "id-do-produto-na-kirvano": "essencial",
    # "id-do-produto-na-kirvano": "profissional",
    # "id-do-produto-na-kirvano": "gestao",
}
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
    """
    # 1) Validação de token
    if KIRVANO_WEBHOOK_TOKEN:
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
        return {"status": "ignored", "event": event}

    supa = get_supabase_admin()
    if not supa:
        raise HTTPException(status_code=500, detail="Supabase admin não configurado no servidor.")

    # 4) Descobre usuário pelo e-mail
    try:
        res = supa.table("profiles").select("id, email, plan").eq("email", email).limit(1).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro Supabase: {str(e)}")

    if not res.data:
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