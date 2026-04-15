import React, { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────
   ARCANE — App.js  (Nexus Design System v3 — Total Redesign)
   Premium Enterprise SaaS · Dark-first · Glass · Depth
   ───────────────────────────────────────────────────────────── */

// ── SUPABASE ──
import { supabase } from "./supabase";

const BACKEND_URL = "https://web-production-ddbd9.up.railway.app/api";

// ══════════════════════════════════════════════════════════════
// GLOBAL STYLES — Nexus v3
// ══════════════════════════════════════════════════════════════
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
  html{scroll-behavior:auto;}
  html,body{height:100%;font-size:14px;}
  body{
    background:#050508;
    color:#fff;
    font-family:'Inter',system-ui,sans-serif;
    -webkit-font-smoothing:antialiased;
    -moz-osx-font-smoothing:grayscale;
    overflow-x:hidden;
    overscroll-behavior:none;
  }
  ::selection{background:rgba(99,102,241,0.4);color:#fff;}
  ::-webkit-scrollbar{width:6px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px;}
  ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.15);}

  /* ── SURFACES ── */
  .glass{
    background:rgba(255,255,255,0.03);
    backdrop-filter:blur(24px) saturate(1.2);
    -webkit-backdrop-filter:blur(24px) saturate(1.2);
    border:1px solid rgba(255,255,255,0.06);
  }
  .glass-strong{
    background:rgba(12,12,20,0.7);
    backdrop-filter:blur(40px) saturate(1.4);
    -webkit-backdrop-filter:blur(40px) saturate(1.4);
    border:1px solid rgba(255,255,255,0.08);
  }
  .surface-elevated{
    background:rgba(255,255,255,0.02);
    border:1px solid rgba(255,255,255,0.06);
    transition:all 0.4s cubic-bezier(.4,0,.2,1);
  }
  .surface-elevated:hover{
    background:rgba(255,255,255,0.05);
    border-color:rgba(255,255,255,0.12);
    transform:translateY(-2px);
    box-shadow:0 12px 40px rgba(0,0,0,0.4);
  }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
  @keyframes ping{75%,100%{transform:scale(2.5);opacity:0}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes glow{0%,100%{opacity:0.4}50%{opacity:0.8}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}

  .reveal{opacity:0;transform:translateY(40px);transition:opacity 0.8s cubic-bezier(.16,1,.3,1),transform 0.8s cubic-bezier(.16,1,.3,1);}
  .reveal.vis{opacity:1;transform:none;}

  /* ── INPUTS ── */
  button{cursor:pointer;font-family:'Inter',system-ui,sans-serif;border:none;transition:all 0.3s cubic-bezier(.4,0,.2,1);}
  input,textarea,select{
    font-family:'Inter',system-ui,sans-serif;
    font-size:14px;
    background:rgba(255,255,255,0.04);
    backdrop-filter:blur(8px);
    border:1px solid rgba(255,255,255,0.08);
    color:#fff;
    border-radius:12px;
    padding:14px 18px;
    width:100%;
    outline:none;
    transition:all 0.3s cubic-bezier(.4,0,.2,1);
  }
  input:focus,textarea:focus,select:focus{
    border-color:rgba(99,102,241,0.5);
    background:rgba(255,255,255,0.06);
    box-shadow:0 0 0 3px rgba(99,102,241,0.1);
  }
  input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2);}
  select option{background:#0c0c14;color:#fff;}

  /* ── BUTTONS ── */
  .btn-primary{
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    padding:0 32px;height:48px;
    background:linear-gradient(135deg,#fff 0%,#e2e8f0 100%);
    color:#0a0a0a;
    font-size:14px;font-weight:600;letter-spacing:0.02em;
    border-radius:14px;
    box-shadow:0 2px 12px rgba(255,255,255,0.15),inset 0 1px 0 rgba(255,255,255,0.5);
    transition:all 0.35s cubic-bezier(.4,0,.2,1);
  }
  .btn-primary:hover{
    background:linear-gradient(135deg,#f1f5f9 0%,#cbd5e1 100%);
    box-shadow:0 4px 24px rgba(255,255,255,0.25),inset 0 1px 0 rgba(255,255,255,0.5);
    transform:translateY(-1px);
  }
  .btn-primary:active{transform:translateY(0);box-shadow:0 1px 8px rgba(255,255,255,0.1);}
  .btn-primary:disabled{opacity:0.35;pointer-events:none;}

  .btn-ghost{
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    padding:0 24px;height:48px;
    background:transparent;color:rgba(255,255,255,0.5);
    font-size:14px;font-weight:500;
    border-radius:14px;border:1px solid rgba(255,255,255,0.1);
    transition:all 0.3s;
  }
  .btn-ghost:hover{color:#fff;border-color:rgba(255,255,255,0.25);background:rgba(255,255,255,0.04);}

  .btn-accent{
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    padding:0 32px;height:48px;
    background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);
    color:#fff;
    font-size:14px;font-weight:600;letter-spacing:0.02em;
    border-radius:14px;
    box-shadow:0 4px 20px rgba(99,102,241,0.4);
    transition:all 0.35s;
  }
  .btn-accent:hover{
    box-shadow:0 6px 32px rgba(99,102,241,0.5);
    transform:translateY(-1px);
  }
  .btn-accent:disabled{opacity:0.35;pointer-events:none;}

  /* ── SECTION LABEL ── */
  .section-label{
    font-size:11px;text-transform:uppercase;font-weight:700;
    color:#818cf8;letter-spacing:0.25em;margin-bottom:16px;display:block;
  }

  /* ── SIDEBAR ── */
  .sidebar{
    width:272px;min-height:100vh;
    background:rgba(8,8,16,0.85);
    backdrop-filter:blur(40px);
    border-right:1px solid rgba(255,255,255,0.06);
    display:flex;flex-direction:column;position:fixed;left:0;top:0;z-index:100;
    transition:transform 0.35s cubic-bezier(.4,0,.2,1);
  }
  .nav-item{
    display:flex;align-items:center;gap:12px;padding:10px 14px;
    color:rgba(255,255,255,0.4);cursor:pointer;transition:all 0.25s;
    font-size:13px;font-weight:400;border-radius:10px;margin:2px 10px;
  }
  .nav-item:hover{color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.04);}
  .nav-item.act{
    color:#a5b4fc;
    background:rgba(99,102,241,0.1);
    border:1px solid rgba(99,102,241,0.15);
    font-weight:500;
  }

  .main-area{margin-left:272px;min-height:100vh;background:transparent;}

  .topbar{
    height:64px;
    background:rgba(8,8,16,0.6);
    backdrop-filter:blur(24px);
    border-bottom:1px solid rgba(255,255,255,0.06);
    display:flex;align-items:center;justify-content:space-between;
    padding:0 28px;position:sticky;top:0;z-index:50;
  }

  /* ── CARDS ── */
  .card{
    background:rgba(255,255,255,0.02);
    backdrop-filter:blur(12px);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:16px;
    position:relative;overflow:hidden;
    transition:all 0.4s cubic-bezier(.4,0,.2,1);
  }
  .card:hover{
    background:rgba(255,255,255,0.04);
    border-color:rgba(255,255,255,0.12);
    transform:translateY(-2px);
    box-shadow:0 8px 32px rgba(0,0,0,0.3);
  }

  .mod-card{
    background:rgba(255,255,255,0.02);
    backdrop-filter:blur(12px);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:20px;
    padding:28px;cursor:pointer;
    transition:all 0.4s cubic-bezier(.4,0,.2,1);
    position:relative;overflow:hidden;
  }
  .mod-card:hover{
    border-color:rgba(99,102,241,0.3);
    background:rgba(255,255,255,0.04);
    transform:translateY(-3px);
    box-shadow:0 12px 40px rgba(0,0,0,0.3);
  }

  .tool-row{
    display:flex;align-items:center;gap:14px;padding:16px 20px;
    background:rgba(255,255,255,0.02);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:14px;
    cursor:pointer;transition:all 0.3s;margin-bottom:8px;
  }
  .tool-row:hover{
    background:rgba(99,102,241,0.06);
    border-color:rgba(99,102,241,0.2);
    transform:translateX(4px);
  }

  .result-box{
    background:rgba(0,0,0,0.3);
    backdrop-filter:blur(12px);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:16px;
    padding:24px;min-height:300px;
    font-size:14px;line-height:1.85;
    white-space:pre-wrap;color:rgba(255,255,255,0.55);
  }

  /* ── TOAST ── */
  .toast{
    position:fixed;bottom:24px;right:24px;
    background:rgba(12,12,20,0.95);
    backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,0.08);
    border-left:3px solid #6366f1;
    color:#fff;padding:16px 24px;font-size:13px;z-index:9999;
    animation:fadeUp 0.3s ease;border-radius:14px;
    box-shadow:0 8px 40px rgba(0,0,0,0.6);
  }

  /* ── UPLOAD ── */
  .upload-zone{
    border:1px dashed rgba(255,255,255,0.1);border-radius:16px;
    padding:36px;text-align:center;cursor:pointer;transition:all 0.3s;
    background:rgba(255,255,255,0.01);
  }
  .upload-zone:hover,.upload-zone.drag{
    border-color:rgba(99,102,241,0.4);background:rgba(99,102,241,0.04);
  }

  /* ── MODAL ── */
  .modal-overlay{
    position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);
    z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;
  }
  .modal-box{
    background:rgba(16,16,24,0.95);backdrop-filter:blur(24px);
    border:1px solid rgba(255,255,255,0.08);border-radius:24px;
    padding:40px;width:100%;max-width:560px;
    box-shadow:0 32px 80px rgba(0,0,0,0.6);
    animation:fadeUp 0.4s cubic-bezier(.16,1,.3,1);
  }

  /* ── WEBGL ── */
  #webgl-canvas{
  position:fixed;
  top:0;
  left:0;
  width:100vw;
  height:100vh;
  z-index:0;
  pointer-events:none;
}

  /* ── MOBILE MENU ── */
  .mobile-menu-btn{
    display:none;position:fixed;top:16px;left:16px;z-index:200;
    width:44px;height:44px;border-radius:12px;
    background:rgba(12,12,20,0.85);backdrop-filter:blur(12px);
    border:1px solid rgba(255,255,255,0.08);
    align-items:center;justify-content:center;
    color:#fff;font-size:20px;
  }

  /* ── RESPONSIVE ── */
  @media(max-width:768px){
    .sidebar{transform:translateX(-100%);}
    .sidebar.open{transform:translateX(0);}
    .main-area{margin-left:0;}
    .mobile-menu-btn{display:flex;}
    .landing-nav-links{display:none !important;}
    .landing-hero-stats{gap:20px !important;}
    .landing-hero-stats>div{min-width:80px;}
    .pricing-grid{grid-template-columns:1fr !important;}
    .how-grid{grid-template-columns:1fr 1fr !important;}
    .modules-grid{grid-template-columns:1fr !important;}
    .tool-grid-2col{grid-template-columns:1fr !important;}
    .plans-dash-grid{grid-template-columns:1fr 1fr !important;}
    .auth-split{flex-direction:column !important;}
    .auth-left{width:100% !important;padding:40px 24px !important;min-height:auto !important;}
    .auth-right{padding:24px !important;}
    .stats-grid{grid-template-columns:1fr !important;}
    .mods-grid{grid-template-columns:1fr !important;}
  }

  @media(max-width:480px){
    .how-grid{grid-template-columns:1fr !important;}
    .plans-dash-grid{grid-template-columns:1fr !important;}
  }
`;

// ══════════════════════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════════════════════
const MODULES = [
  { id: "diagnostico_financeiro", icon: "◎", label: "Financeiro", plan: "free", color: "#fbbf24", desc: "Visão estratégica, previsibilidade e controle absoluto do seu caixa.",
    tools: [
      { id: "analisar_planilha", name: "Analisar Planilha / Extrato", desc: "Envie seus dados e receba diagnóstico completo", upload: true },
      { id: "fluxo_caixa_diagnostico", name: "Diagnosticar Fluxo de Caixa", desc: "Identifique riscos e gaps no seu caixa" },
      { id: "identificar_desperdicio", name: "Identificar Desperdícios", desc: "Onde você está perdendo dinheiro" },
      { id: "projecao_cenarios", name: "Projeção de Cenários", desc: "Pessimista, realista e otimista para 6 meses" },
    ] },
  { id: "juridico", icon: "⬡", label: "Jurídico", plan: "essencial", color: "#fb923c", desc: "Governança, conformidade e auditoria de contratos com precisão de IA.",
    tools: [
      { id: "revisar_contrato", name: "Revisar Contrato", desc: "Identifique riscos antes de assinar", upload: true },
      { id: "gerar_contrato", name: "Gerar Contrato", desc: "Contrato profissional em minutos" },
      { id: "lgpd_diagnostico", name: "Diagnóstico LGPD", desc: "Nível de conformidade e plano de adequação" },
      { id: "nda", name: "Acordo de Confidencialidade", desc: "NDA robusto para proteger seu negócio" },
    ] },
  { id: "rh", icon: "⬟", label: "RH & Pessoas", plan: "free", color: "#e879f9", desc: "Inteligência em gestão de talentos, performance e cultura.",
    tools: [
      { id: "diagnostico_time", name: "Diagnosticar o Time", desc: "Riscos, gaps e plano de retenção" },
      { id: "descricao_vaga", name: "Criar Descrição de Vaga", desc: "Atraia os candidatos certos" },
      { id: "avaliacao_desempenho", name: "Avaliação de Desempenho", desc: "Formulário estruturado com plano de metas" },
      { id: "plano_onboarding", name: "Plano de Onboarding", desc: "Integre novos colaboradores com eficiência" },
      { id: "politica_interna", name: "Política Interna", desc: "Regras claras que alinham a equipe" },
    ] },
  { id: "marketing", icon: "◆", label: "Marketing Digital", plan: "free", color: "#f472b6", desc: "Máquina de aquisição in-house orientada a dados e conversão.",
    tools: [
      { id: "diagnostico_marketing", name: "Diagnosticar Marketing", desc: "Gaps, oportunidades e estratégia de 90 dias" },
      { id: "estrategia_conteudo", name: "Estratégia de Conteúdo", desc: "Plano editorial de 30 dias por canal" },
      { id: "copy_vendas", name: "Copy de Vendas", desc: "Textos que convertem para produto ou serviço" },
      { id: "post_redes_sociais", name: "Posts para Redes Sociais", desc: "LinkedIn, Instagram e WhatsApp prontos" },
    ] },
  { id: "operacoes", icon: "◈", label: "Operações", plan: "free", color: "#38bdf8", desc: "Padronização, automação de processos e eficiência em escala.",
    tools: [
      { id: "diagnostico_processos", name: "Diagnosticar Processos", desc: "Gargalos, desperdícios e mapa do processo ideal" },
      { id: "proposta_comercial", name: "Proposta Comercial", desc: "Proposta consultiva que fecha negócio" },
      { id: "ata_reuniao", name: "Ata de Reunião", desc: "Decisões e tarefas documentadas com precisão" },
      { id: "email_profissional", name: "E-mail Profissional", desc: "Comunicação corporativa clara e eficaz" },
    ] },
  { id: "consultoria", icon: "★", label: "Consultoria Estratégica", plan: "profissional", color: "#a78bfa", desc: "Consultoria de alto nível para decisões críticas",
    tools: [
      { id: "diagnostico_completo", name: "Diagnóstico Completo do Negócio", desc: "Visão 360° com prioridades e roteiro de 90 dias" },
      { id: "plano_crescimento", name: "Plano de Crescimento", desc: "Estratégia para dobrar o negócio em 12 meses" },
      { id: "analise_concorrentes", name: "Análise de Concorrentes", desc: "Inteligência competitiva e posicionamento" },
    ] },
];

const TOOL_TIME = {
  analisar_planilha: 180, fluxo_caixa_diagnostico: 120, identificar_desperdicio: 90, projecao_cenarios: 150,
  revisar_contrato: 180, gerar_contrato: 120, lgpd_diagnostico: 240, nda: 90,
  diagnostico_time: 120, descricao_vaga: 60, avaliacao_desempenho: 90, plano_onboarding: 120, politica_interna: 150,
  diagnostico_marketing: 120, estrategia_conteudo: 90, copy_vendas: 60, post_redes_sociais: 45,
  diagnostico_processos: 150, proposta_comercial: 90, ata_reuniao: 30, email_profissional: 20,
  diagnostico_completo: 300, plano_crescimento: 240, analise_concorrentes: 180,
};
const HOURLY_RATE = 80;

const PLANS = [
  { id: "free", name: "Starter", price: "R$ 0", period: "", limit: 10, highlight: false,
    features: ["10 análises/mês", "Módulos: Financeiro, RH, Marketing, Operações", "Upload de planilhas e contratos", "Histórico de 7 dias"] },
  { id: "essencial", name: "Essencial", price: "R$ 147", period: "/mês", limit: 200, highlight: false,
    features: ["200 análises/mês", "Todos os módulos básicos", "Módulo Jurídico", "Histórico completo", "Suporte prioritário"] },
  { id: "profissional", name: "Profissional", price: "R$ 347", period: "/mês", limit: 600, highlight: true,
    features: ["600 análises/mês", "Todos os módulos", "Consultoria Estratégica", "Diagnóstico Completo do Negócio", "Suporte dedicado"] },
  { id: "gestao", name: "Gestão", price: "R$ 597", period: "/mês", limit: 99999, highlight: false,
    features: ["Análises ilimitadas", "Tudo do Profissional", "Múltiplos usuários", "API de integração", "SLA garantido"] },
];

const PLAN_ORDER = { free: 0, essencial: 1, starter: 1, profissional: 2, business: 2, gestao: 3, unlimited: 3 };
const MP_LINKS = {
  essencial: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=f33b7ffb9fc5463f82b079e24dfa9e43",
  profissional: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=60b050ff92e44a178b1a0b009cb140e0",
  gestao: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=5e5810b4f083411fb6aaf6f0cbb9eed5",
};

const FAQS = [
  { q: "O Arcane substitui um funcionário?", a: "Para pequenas empresas, sim. O Arcane concentra jurídico, financeiro, RH e marketing — áreas que normalmente exigiriam ao menos 2-3 profissionais. Você paga uma fração do salário e tem acesso 24 horas." },
  { q: "Posso enviar minhas planilhas para análise?", a: "Sim. No módulo Financeiro você faz upload de planilhas Excel ou CSV, ou cola os dados diretamente. O sistema lê, interpreta e entrega um diagnóstico detalhado com ações concretas." },
  { q: "Os meus dados ficam seguros?", a: "Sim. Utilizamos criptografia e seus dados nunca são usados para treinar modelos. Seguimos integralmente a LGPD." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem burocracia. O cancelamento é imediato e você mantém acesso até o final do período pago." },
  { q: "O sistema funciona para qualquer tipo de negócio?", a: "Sim. Atende desde MEIs e autônomos até empresas com equipes de 50+ pessoas. Quanto mais contexto você fornecer, mais precisa e específica será a análise." },
];

const SECTORS = ["Varejo", "Serviços", "Tecnologia", "Saúde", "Educação", "Construção", "Alimentação", "Agronegócio", "Logística", "Consultoria", "Jurídico", "Contabilidade", "Marketing / Agência", "Outro"];
const SIZES = ["MEI / Autônomo", "Microempresa (2-9 funcionários)", "Pequena empresa (10-49 funcionários)", "Média empresa (50+ funcionários)"];
const TONES = ["Formal e técnico", "Neutro e profissional", "Descontraído e próximo"];

// ══════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════
function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); obs.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function canUse(userPlan, reqPlan) { return (PLAN_ORDER[userPlan] || 0) >= (PLAN_ORDER[reqPlan] || 0); }

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.onerror = reject;
    r.readAsText(file, "UTF-8");
  });
}

function calcSaved(history) {
  const mins = history.reduce((a, h) => a + (TOOL_TIME[h.tool] || 60), 0);
  const hours = Math.round(mins / 60 * 10) / 10;
  return { hours, value: Math.round(hours * HOURLY_RATE) };
}

// ══════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ══════════════════════════════════════════════════════════════
function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div className="toast">{msg}</div>;
}

function Logo({ size = 18 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: size * 0.55, height: size * 0.55, borderRadius: "50%",
        background: "linear-gradient(135deg,#6366f1,#818cf8)",
        boxShadow: "0 0 12px rgba(99,102,241,0.5)",
      }} />
      <span style={{
        fontSize: size, fontWeight: 700, letterSpacing: "0.2em",
        backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent",
        backgroundImage: "linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #6366f1 100%)",
      }}>ARCANE</span>
    </div>
  );
}

function PlanTag({ plan }) {
  const map = { free: "free", essencial: "essencial", starter: "essencial", profissional: "profissional", business: "profissional", gestao: "gestao", unlimited: "gestao" };
  const key = map[plan] || "free";
  const labels = { free: "Starter", essencial: "Essencial", profissional: "Profissional", gestao: "Gestão" };
  const colors = {
    free: { bg: "rgba(255,255,255,0.04)", text: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.08)" },
    essencial: { bg: "rgba(99,102,241,0.08)", text: "#a5b4fc", border: "rgba(99,102,241,0.2)" },
    profissional: { bg: "rgba(16,185,129,0.08)", text: "#34d399", border: "rgba(16,185,129,0.2)" },
    gestao: { bg: "rgba(167,139,250,0.08)", text: "#c4b5fd", border: "rgba(167,139,250,0.2)" },
  };
  const c = colors[key];
  return (
    <span style={{
      display: "inline-block", padding: "4px 12px", borderRadius: 9999,
      fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase",
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>{labels[key] || plan}</span>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>{children}</div>;
}

// ══════════════════════════════════════════════════════════════
// THREE.JS HERO BACKGROUND
// ══════════════════════════════════════════════════════════════
const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => { s.dataset.loaded = "true"; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });

const loadGlobeDeps = () =>
  loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js")
    .then(() => Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"),
    ]))
    .then(() => loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"));
// Adicione isso ANTES de function HeroBackground() { ... }

const createGlowTexture = (THREE) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  
  // Cria o gradiente radial (Centro brilhante -> Borda transparente)
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(80, 130, 255, 0.5)');  // Azul central brilhante
  gradient.addColorStop(0.5, 'rgba(50, 80, 200, 0.2)'); // Azul intermediário
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');         // Totalmente transparente

  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  
  return new THREE.CanvasTexture(canvas);
};
function HeroBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    let renderer, scene, camera, globeGroup, particles, wireframeMaterial;
    let rafId = null;
    let timeline = null;
    let disposed = false;
    let resizeHandler = null;
    let loadHandler = null;

    loadGlobeDeps()
      .then(() => {
        if (disposed) return;

        const canvas = canvasRef.current;
        if (!canvas || !window.THREE || !window.gsap) return;

        const THREE = window.THREE;
        const { gsap } = window;
        const ScrollTrigger = window.ScrollTrigger;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(
          45,
          window.innerWidth / window.innerHeight,
          0.1,
          100
        );
        camera.position.set(0, 0, 18);

        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        globeGroup = new THREE.Group();
        scene.add(globeGroup);

        const geometry = new THREE.IcosahedronGeometry(5, 2);
        wireframeMaterial = new THREE.MeshBasicMaterial({
          color: 0x2d1b69,
          wireframe: true,
          transparent: true,
          opacity: 0.7,
        });
        globeGroup.add(new THREE.Mesh(geometry, wireframeMaterial));

        const shieldGeometry = new THREE.IcosahedronGeometry(5.15, 4);

        const vertexShader = `
          varying vec3 vNormal;
          varying vec3 vPosition;

          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `;

        const fragmentShader = `
          varying vec3 vNormal;
          varying vec3 vPosition;

          void main() {
            vec3 viewDirection = normalize(-vPosition);
            float fresnel = clamp(1.0 - dot(viewDirection, vNormal), 0.0, 1.0);
            fresnel = pow(fresnel, 5.0);

            vec3 rimColor = vec3(0.35, 0.3, 0.95);
            gl_FragColor = vec4(rimColor, fresnel * 0.85);
          }
        `;

        const shieldMaterial = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        globeGroup.add(new THREE.Mesh(shieldGeometry, shieldMaterial));

        const particleCount = 180;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
          const r = 6.5 + Math.random() * 7.5;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);

          particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          particlePositions[i * 3 + 2] = r * Math.cos(phi);
        }

        particleGeometry.setAttribute(
          "position",
          new THREE.BufferAttribute(particlePositions, 3)
        );

        particles = new THREE.Points(
          particleGeometry,
          new THREE.PointsMaterial({
            size: 0.04,
            color: 0x818cf8,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
          })
        );

        globeGroup.add(particles);
// --------------------------------------------------------
        // NOVO: ADICIONANDO O EFEITO DE BRILHO (GLOW SPRITE)
        // --------------------------------------------------------
        const glowTexture = createGlowTexture(THREE);
        const glowMaterial = new THREE.SpriteMaterial({
          map: glowTexture,
          color: 0xffffff, // Mantém a cor original da textura
          transparent: true,
          blending: THREE.AdditiveBlending, // Faz a luz "somar" com o fundo, gerando o brilho
          depthWrite: false, // Evita bugar a sobreposição com o globo
        });
        
        const glowSprite = new THREE.Sprite(glowMaterial);
        
        // O raio do seu globo é ~5. Vamos fazer o brilho bem maior para espalhar.
        // Você pode ajustar esses valores (24) para deixar o brilho maior ou menor
        glowSprite.scale.set(24, 24, 1); 
        
        // Adiciona o brilho ao mesmo grupo do globo. 
        // Assim, quando o GSAP mover o globo, o brilho vai junto!
        globeGroup.add(glowSprite);
        // --------------------------------------------------------
        const clock = new THREE.Clock();

        const animate = () => {
          if (disposed) return;

          const t = clock.getElapsedTime();

          globeGroup.rotation.y = t * 0.05;
          particles.rotation.y = t * -0.02;
          particles.rotation.z = t * 0.01;

          renderer.render(scene, camera);
          rafId = requestAnimationFrame(animate);
        };

        animate();

        resizeHandler = () => {
          if (!camera || !renderer) return;

          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);

          if (ScrollTrigger) ScrollTrigger.refresh();
        };

        window.addEventListener("resize", resizeHandler);

        if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

        timeline = gsap.timeline({
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "+=4000",
            scrub: 0.8,
            onRefresh: () => console.log("[ScrollTrigger] refreshed"),
          },
        });

        timeline
          .to(camera.position, { z: 22, y: -2, ease: "power1.inOut", duration: 1 }, 0)
          .to(
            wireframeMaterial.color,
            { r: 0.3, g: 0.3, b: 0.3, ease: "power1.inOut", duration: 1 },
            0
          )
          .to(globeGroup.position, { x: 4, ease: "power1.inOut", duration: 1 }, 0)
          .to(
            globeGroup.position,
            { y: -15, x: 0, duration: 1.5, ease: "power2.inOut" },
            1
          )
          .to(globeGroup.rotation, { x: Math.PI / 2, duration: 1.5 }, 1)
          .to(globeGroup.position, { y: 0, z: -10, duration: 1.5 }, 2.5)
          .to(globeGroup.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 1.5 }, 2.5)
          .to(globeGroup.position, { y: -20, z: -20, duration: 2 }, 4);

        loadHandler = () => {
          if (ScrollTrigger) ScrollTrigger.refresh();
        };

        window.addEventListener("load", loadHandler);

        setTimeout(() => {
          if (!disposed && ScrollTrigger) ScrollTrigger.refresh();
        }, 200);

        setTimeout(() => {
          if (!disposed && ScrollTrigger) ScrollTrigger.refresh();
        }, 1000);
      })
      .catch((err) => {
        console.warn("[HeroBackground] Failed to load WebGL deps:", err);
      });

    return () => {
      disposed = true;

      if (rafId) cancelAnimationFrame(rafId);
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      if (loadHandler) window.removeEventListener("load", loadHandler);

      if (timeline) {
        if (timeline.scrollTrigger) timeline.scrollTrigger.kill();
        timeline.kill();
      }

      if (globeGroup) {
        globeGroup.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();

          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      }

      if (renderer) {
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="webgl-canvas"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// ══════════════════════════════════════════════════════════════
// LANDING PAGE
// ══════════════════════════════════════════════════════════════
function Landing({ onLogin, onRegister }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  useScrollReveal();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ background: "#050508", minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
      <style>{G}</style>
      <HeroBackground />

      {/* ── HEADER ── */}
      <header className="glass-strong" style={{
        position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
        width: "92%", maxWidth: 1000, zIndex: 50, borderRadius: 18,
        padding: "10px 10px 10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: scrolled ? "0 8px 40px rgba(0,0,0,0.6)" : "0 4px 20px rgba(0,0,0,0.3)",
        transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
      }}>
        <div style={{ flex: 1 }}><Logo size={15} /></div>
        <nav className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 500, color: "rgba(255,255,255,0.45)" }}>
          {["Como Funciona", "Módulos", "Planos", "FAQ"].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}>{item}</a>
          ))}
        </nav>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
          <a onClick={onLogin} style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "8px 16px", transition: "color 0.2s" }}
            onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}>Entrar</a>
          <button onClick={onRegister} className="btn-accent" style={{ height: 38, padding: "0 24px", fontSize: 12, borderRadius: 12 }}>Iniciar Teste Premium</button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 16px 0" }}>
        <div className="reveal" style={{ maxWidth: 880, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
          {/* Status badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            border: "1px solid rgba(99,102,241,0.2)", borderRadius: 9999,
            padding: "6px 18px", marginBottom: 36,
            background: "rgba(99,102,241,0.06)", backdropFilter: "blur(8px)",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px rgba(16,185,129,0.8)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)" }}>
              Sistema de Gestão para Empresas e Autônomos
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk','Inter',sans-serif",
            fontSize: "clamp(44px,7vw,76px)", lineHeight: 1.05, marginBottom: 28,
            letterSpacing: "-0.03em", fontWeight: 300,
          }}>
            O poder de um<br />departamento inteiro,<br />
            <span style={{
              color: "transparent", backgroundClip: "text", WebkitBackgroundClip: "text",
              backgroundImage: "linear-gradient(135deg, #c7d2fe 0%, #6366f1 50%, #4338ca 100%)",
            }}>em um único sistema.</span>
          </h1>

          <p style={{
            fontSize: "clamp(16px,2vw,19px)", color: "rgba(255,255,255,0.4)", maxWidth: 580,
            marginBottom: 44, fontWeight: 300, lineHeight: 1.75,
          }}>
            Gestão integrada de Jurídico, Financeiro, RH e Marketing. Envie seus documentos e deixe o Arcane processar, diagnosticar e entregar um plano de ação exato em segundos.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 56 }}>
            <button onClick={onRegister} className="btn-accent" style={{ padding: "0 40px", height: 54, fontSize: 15, borderRadius: 16 }}>
              Iniciar Teste Premium
            </button>
            <button onClick={onLogin} className="btn-ghost" style={{ height: 54, fontSize: 14, borderRadius: 16 }}>Ver o Arcane em Ação</button>
          </div>

          {/* Stats row */}
          <div className="landing-hero-stats" style={{ display: "flex", gap: 48, justifyContent: "center" }}>
            {[
              { n: "6", l: "Módulos especializados" },
              { n: "Upload", l: "Planilhas e contratos" },
              { n: "< 30s", l: "Por diagnóstico" },
            ].map(s => (
              <div key={s.n} style={{ textAlign: "center" }}>
                <div style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 300,
                  fontVariantNumeric: "tabular-nums", marginBottom: 6,
                  backgroundClip: "text", WebkitBackgroundClip: "text",
                  backgroundImage: "linear-gradient(to bottom, #fff, #a5b4fc)",
                  WebkitTextFillColor: "transparent",
                }}>{s.n}</div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", animation: "float 3s ease infinite", zIndex: 10 }}>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(99,102,241,0.4), transparent)" }} />
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section style={{ position: "relative", zIndex: 10, padding: "40px 24px 80px" }}>
        <div className="reveal" style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            display: "flex", justifyContent: "center", gap: 40, alignItems: "center",
            padding: "20px 0", opacity: 0.3,
          }}>
            {["LGPD Compliant", "Dados Criptografados", "Servidores Seguros", "Cancelamento Imediato"].map(t => (
              <span key={t} style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" style={{ position: "relative", zIndex: 10, padding: "80px 24px 100px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 64, maxWidth: 600, margin: "0 auto 64px" }}>
            <span className="section-label">Como Funciona</span>
            <h2 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: "clamp(32px,4.5vw,48px)", fontWeight: 300, marginBottom: 20, letterSpacing: "-0.02em" }}>
              Operacional desde<br /><span style={{ color: "rgba(255,255,255,0.3)" }}>o primeiro acesso.</span>
            </h2>
          </div>
          <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {[
              { n: "01", t: "Acesse o sistema", d: "Cadastro em menos de 2 minutos. Sem cartão." },
              { n: "02", t: "Configure sua empresa", d: "Nome, setor e tom de comunicação. Só uma vez." },
              { n: "03", t: "Envie seus dados", d: "Planilha, contrato ou descrição da situação." },
              { n: "04", t: "Receba o diagnóstico", d: "Plano de ação estratégico e executável em segundos." },
            ].map((s, i) => (
                <div key={i} className="reveal" style={{
                borderRadius: 18, padding: 28, overflow: "hidden",
                transitionDelay: `${i * 0.1}s`,
                background: i === 2 ? "rgba(99,102,241,0.06)" : "rgba(12,12,20,0.7)",
                backdropFilter: "blur(40px) saturate(1.4)",
                WebkitBackdropFilter: "blur(40px) saturate(1.4)",
                border: `1px solid ${i === 2 ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.08)"}`,
                boxShadow: i === 2 ? "0 0 40px rgba(99,102,241,0.08)" : "0 8px 32px rgba(0,0,0,0.3)",
                transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
                }}>   
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: `1px solid ${i === 2 ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}`,
                  background: i === 2 ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: i === 2 ? "#a5b4fc" : "rgba(255,255,255,0.5)",
                  marginBottom: 24, fontFamily: "'JetBrains Mono',monospace",
                }}>{s.n}</div>
                <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, letterSpacing: "-0.01em" }}>{s.t}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.65, fontWeight: 300 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULOS ── */}
      <section id="módulos" style={{ position: "relative", zIndex: 10, padding: "80px 24px 100px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: 56, maxWidth: 560 }}>
            <span className="section-label">Módulos</span>
            <h2 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: "clamp(32px,4.5vw,48px)", fontWeight: 300, letterSpacing: "-0.02em" }}>
              Todas as áreas<br /><span style={{ color: "rgba(255,255,255,0.3)" }}>do seu negócio.</span>
            </h2>
          </div>
          <div className="modules-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {MODULES.map((m, i) => (
              <div key={m.id} className="reveal" style={{
              borderRadius: 20, padding: 28, cursor: "pointer",
              transitionDelay: `${i * 0.06}s`,
              background: "rgba(12,12,20,0.7)",
              backdropFilter: "blur(40px) saturate(1.4)",
              WebkitBackdropFilter: "blur(40px) saturate(1.4)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
              }}
              onMouseEnter={e => {
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
              }}
>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: `${m.color}10`, border: `1px solid ${m.color}25`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, color: m.color,
                  }}>{m.icon}</div>
                  <PlanTag plan={m.plan} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: "#fff", marginBottom: 8, letterSpacing: "-0.01em" }}>{m.label}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 20, lineHeight: 1.6, fontWeight: 300 }}>{m.desc}</p>
                {m.tools.slice(0, 3).map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                    <span style={{ color: m.color, fontSize: 7 }}>●</span>{t.name}
                  </div>
                ))}
                {m.tools.length > 3 && <div style={{ fontSize: 11, color: "#818cf8", marginTop: 12, fontWeight: 500 }}>+{m.tools.length - 3} funções</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" style={{ position: "relative", zIndex: 10, padding: "80px 24px 100px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 56, maxWidth: 560, margin: "0 auto 56px" }}>
            <span className="section-label">Planos</span>
            <h2 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: "clamp(32px,4.5vw,48px)", fontWeight: 300, marginBottom: 20, letterSpacing: "-0.02em" }}>Simples, transparente.</h2>
            <p style={{ color: "rgba(255,255,255,0.35)", lineHeight: 1.7, fontWeight: 300 }}>
              Menos que um salário, mais que um departamento. Comece grátis, sem cartão.
            </p>
          </div>

          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {PLANS.map((p, idx) => (
              <div key={p.id} className="reveal" style={{
                background: p.highlight ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.02)",
                backdropFilter: "blur(16px)",
                border: `1px solid ${p.highlight ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 22, padding: 32, position: "relative",
                boxShadow: p.highlight ? "0 0 40px rgba(99,102,241,0.08)" : "none",
                transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
                transitionDelay: `${idx * 0.08}s`,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = p.highlight ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = p.highlight ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)"; }}
              >
                {p.highlight && <div style={{
                  position: "absolute", top: -1, left: 0, right: 0, height: 2,
                  background: "linear-gradient(90deg,transparent,#6366f1,transparent)",
                }} />}
                {p.highlight && <div style={{
                  position: "absolute", top: 16, right: 16,
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                  color: "#fff", fontSize: 9, fontWeight: 700, padding: "4px 12px",
                  letterSpacing: "0.15em", borderRadius: 8, textTransform: "uppercase",
                }}>Popular</div>}
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>{p.name}</div>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 32, fontWeight: 700, color: p.highlight ? "#a5b4fc" : "#fff" }}>{p.price}</span>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, marginLeft: 4 }}>{p.period}</span>
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 24 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                  {p.features.map((f, fi) => (
                    <div key={fi} style={{ display: "flex", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                      <span style={{ color: p.highlight ? "#818cf8" : "#10b981", flexShrink: 0, fontSize: 12 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (p.id === "free") { onRegister(); }
                    else { window.open(MP_LINKS[p.id], "_blank"); }
                  }}
                  className={p.highlight ? "btn-accent" : "btn-ghost"}
                  style={{ width: "100%", height: 44, fontSize: 13, borderRadius: 12 }}>
                  {p.id === "free"
                    ? "Ver o Arcane em ação"
                    : p.id === "profissional"
                    ? "Desbloquear Profissional"
                    : p.id === "gestao"
                    ? "Elevar para Gestão"
                    : "Assinar agora"}
                </button>
                {p.id !== "free" && <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "rgba(255,255,255,0.2)" }}>PIX · Cartão · Boleto</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ position: "relative", zIndex: 10, padding: "80px 24px 100px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="section-label">FAQ</span>
            <h2 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: "clamp(28px,3.5vw,36px)", fontWeight: 300, letterSpacing: "-0.02em" }}>Perguntas frequentes.</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQS.map((faq, i) => (
              <div key={i} className="reveal" style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16, overflow: "hidden", transition: "all 0.3s",
                transitionDelay: `${i * 0.05}s`,
              }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                  width: "100%", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "transparent", color: "#fff", fontSize: 14, fontWeight: 500, textAlign: "left",
                }}>
                  {faq.q}
                  <svg style={{ width: 18, height: 18, color: "rgba(255,255,255,0.3)", transition: "transform 0.3s", transform: openFaq === i ? "rotate(180deg)" : "none", flexShrink: 0, marginLeft: 16 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 24px 20px", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.75, fontWeight: 300 }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ minHeight: "60vh", position: "relative", zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "100px 24px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="reveal" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: "clamp(40px,6vw,64px)", marginBottom: 24, fontWeight: 300, letterSpacing: "-0.03em" }}>
            Assuma o controle absoluto<br />da sua operação.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.35)", marginBottom: 40, maxWidth: 480, lineHeight: 1.7, fontWeight: 300 }}>
            Implementação imediata. Comece a transformar seus dados em decisões em menos de 2 minutos.
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <button onClick={onRegister} className="btn-accent" style={{ padding: "0 40px", height: 52, fontSize: 14, borderRadius: 16 }}>Iniciar Teste Premium</button>
            <button onClick={onLogin} className="btn-ghost" style={{ fontSize: 14, borderRadius: 16 }}>Ver o Arcane em Ação</button>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ width: "100%", paddingBottom: 32, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.04)", maxWidth: 1100, margin: "80px auto 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 32, marginBottom: 32 }}>
            <div>
              <Logo size={14} />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", maxWidth: 260, marginTop: 12, lineHeight: 1.6 }}>Sistema de gestão inteligente para empresas brasileiras.</p>
            </div>
            <div style={{ display: "flex", gap: 48, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", fontSize: 10 }}>Produto</p>
                <a href="#como-funciona" style={{ color: "inherit", textDecoration: "none" }}>Como Funciona</a>
                <a href="#módulos" style={{ color: "inherit", textDecoration: "none" }}>Módulos</a>
                <a href="#planos" style={{ color: "inherit", textDecoration: "none" }}>Planos</a>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", fontSize: 10 }}>Legal</p>
                <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Privacidade</a>
                <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Termos</a>
                <a href="#" style={{ color: "inherit", textDecoration: "none" }}>LGPD</a>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "rgba(255,255,255,0.15)", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <p>© 2026 Arcane. Todos os direitos reservados.</p>
            <p>LGPD Compliant · Feito para empresas brasileiras</p>
          </div>
        </footer>
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// AUTH PAGE
// ══════════════════════════════════════════════════════════════
function AuthPage({ mode, onSuccess, onSwitch }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    setLoading(true); setError("");
    try {
      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name } },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id, email: form.email, name: form.name,
            plan: "free", generations_used: 0, profile_complete: false,
          });
          onSuccess({ id: data.user.id, email: form.email, name: form.name, plan: "free" });
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email, password: form.password,
        });
        if (signInError) throw signInError;
        if (data.user) {
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
          onSuccess({
            id: data.user.id, email: data.user.email,
            name: profileData?.name || data.user.user_metadata?.name || "",
            plan: profileData?.plan || "free",
          });
        }
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="auth-split" style={{ minHeight: "100vh", display: "flex", background: "#050508" }}>
      <style>{G}</style>
      <HeroBackground />

      {/* Left panel */}
      <div className="auth-left" style={{
        width: "45%", position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "80px 64px",
        background: "linear-gradient(135deg, rgba(99,102,241,0.03) 0%, transparent 60%)",
      }}>
        <Logo size={16} />
        <div style={{ marginTop: 64 }}>
          <span className="section-label">Sistema de Gestão</span>
          <h2 style={{
            fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: 34, fontWeight: 300,
            lineHeight: 1.15, marginBottom: 24, letterSpacing: "-0.02em",
          }}>
            O poder de um departamento inteiro, operando em um único sistema.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, lineHeight: 1.8, marginBottom: 40, fontWeight: 300 }}>
            Gestão integrada de Jurídico, Financeiro, RH e Marketing. Envie seus documentos e deixe o Arcane processar, diagnosticar e entregar um plano de ação exato em segundos.
          </p>
          {["Diagnóstico financeiro com upload de planilha", "Revisão e geração de contratos jurídicos", "RH, marketing e operações em um lugar", "Funciona para MEI, autônomo e empresas"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1", flexShrink: 0 }} />
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 300 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="auth-right" style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 64px", position: "relative", zIndex: 10,
      }}>
        <div style={{
          width: "100%", maxWidth: 420,
          background: "rgba(255,255,255,0.02)", backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24,
          padding: "40px 36px",
        }}>
          <h3 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: 26, fontWeight: 400, marginBottom: 8, letterSpacing: "-0.01em" }}>{mode === "login" ? "Acessar o sistema" : "Criar conta"}</h3>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 32, fontWeight: 300 }}>
            {mode === "login" ? "Entre para continuar no Arcane" : "Comece sem custo, sem cartão de crédito"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <div><FieldLabel>Nome</FieldLabel><input placeholder="Seu nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            )}
            <div><FieldLabel>E-mail</FieldLabel><input type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><FieldLabel>Senha</FieldLabel><input type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} onKeyDown={e => e.key === "Enter" && handle()} /></div>
            {error && (
              <div style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)", padding: "12px 16px", fontSize: 13, color: "#fda4af", borderRadius: 12 }}>
                ⚠ {error}
              </div>
            )}
            <button className="btn-accent" onClick={handle} disabled={loading} style={{ width: "100%", height: 48, fontSize: 14, marginTop: 4, borderRadius: 14 }}>
              {loading ? "Aguarde..." : mode === "login" ? "Acessar o sistema" : "Criar conta grátis"}
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>{mode === "login" ? "Não tem conta? " : "Já tem conta? "}</span>
            <span onClick={onSwitch} style={{ color: "#818cf8", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>{mode === "login" ? "Criar gratuitamente →" : "Acessar →"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// COMPANY PROFILE MODAL
// ══════════════════════════════════════════════════════════════
function CompanyProfileModal({ userId, onComplete }) {
  const [form, setForm] = useState({ company_name: "", sector: "", company_size: "", tone: "Neutro e profissional", city: "" });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!form.company_name.trim()) return;
    setLoading(true);
    await supabase.from("profiles").update({ ...form, profile_complete: true }).eq("id", userId);
    setLoading(false);
    onComplete(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div style={{ marginBottom: 32 }}>
          <span className="section-label">Bem-vindo ao Arcane</span>
          <div style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: 22, fontWeight: 400, marginBottom: 12 }}>Conte-nos sobre sua empresa</div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.7, fontWeight: 300 }}>
            Essas informações personalizam todas as análises para o contexto do seu negócio. Você só preenche uma vez.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><FieldLabel>Nome da empresa *</FieldLabel><input placeholder="Ex: Studio Criativo Ltda" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><FieldLabel>Setor</FieldLabel><select value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })}><option value="">Selecione...</option>{SECTORS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><FieldLabel>Tamanho</FieldLabel><select value={form.company_size} onChange={e => setForm({ ...form, company_size: e.target.value })}><option value="">Selecione...</option>{SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><FieldLabel>Cidade</FieldLabel><input placeholder="Ex: São Paulo, SP" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><FieldLabel>Tom de comunicação</FieldLabel><select value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })}>{TONES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          </div>
          <button className="btn-accent" onClick={save} disabled={loading || !form.company_name.trim()} style={{ width: "100%", height: 48, marginTop: 8, borderRadius: 14 }}>
            {loading ? "Salvando..." : "Começar a usar o Arcane →"}
          </button>
          <button onClick={() => onComplete(null)} style={{ background: "transparent", color: "rgba(255,255,255,0.25)", fontSize: 12, padding: "4px 0" }}>Pular por agora</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PROFILE EDITOR
// ══════════════════════════════════════════════════════════════
function ProfileEditor({ userId, profile, onSave, setToast }) {
  const [form, setForm] = useState({
    company_name: profile.company_name || "", sector: profile.sector || "",
    company_size: profile.company_size || "", tone: profile.tone || "Neutro e profissional", city: profile.city || "",
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    await supabase.from("profiles").update({ ...form, profile_complete: true }).eq("id", userId);
    onSave(form); setToast("Perfil da empresa salvo!"); setLoading(false);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <span className="section-label">Minha Empresa</span>
        <div style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: 22, fontWeight: 400, marginBottom: 8 }}>Perfil da empresa</div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.7, fontWeight: 300 }}>
          Esses dados personalizam todas as análises automaticamente. Você não precisa repetir o contexto em cada uso.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div><FieldLabel>Nome da empresa</FieldLabel><input placeholder="Ex: Studio Criativo Ltda" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><FieldLabel>Setor</FieldLabel><select value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })}><option value="">Selecione...</option>{SECTORS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><FieldLabel>Tamanho</FieldLabel><select value={form.company_size} onChange={e => setForm({ ...form, company_size: e.target.value })}><option value="">Selecione...</option>{SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><FieldLabel>Cidade</FieldLabel><input placeholder="Ex: São Paulo, SP" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
          <div><FieldLabel>Tom de comunicação</FieldLabel><select value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })}>{TONES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        </div>
        <button className="btn-accent" onClick={save} disabled={loading} style={{ width: "100%", height: 48, marginTop: 8, borderRadius: 14 }}>
          {loading ? "Salvando..." : "Salvar perfil da empresa"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState("home");
  const [modId, setModId] = useState(null);
  const [tool, setTool] = useState(null);
  const [input, setInput] = useState("");
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [history, setHistory] = useState([]);
  const [selHist, setSelHist] = useState(null);
  const [profile, setProfile] = useState({ plan: user.plan || "free", generations_used: 0 });
  const [drag, setDrag] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileRef = useRef();

  const mod = MODULES.find(m => m.id === modId);
  const plan = PLANS.find(p => p.id === (profile.plan || "free")) || PLANS[0];
  const used = profile.generations_used || 0;
  const limit = plan.limit;
  const pct = limit >= 99999 ? 0 : Math.min((used / limit) * 100, 100);
  const left = limit >= 99999 ? "inf" : Math.max(limit - used, 0);
  const saved = calcSaved(history);

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) { setProfile(data); if (!data.profile_complete) setShowModal(true); }
  }, [user.id]);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase.from("history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    if (data) setHistory(data);
  }, [user.id]);

  useEffect(() => { loadProfile(); loadHistory(); }, [loadProfile, loadHistory]);

  const handleFile = async (file) => {
    if (!file) return;
    try { const text = await readFileAsText(file); setFileText(text); setFileName(file.name); setToast(`Arquivo "${file.name}" carregado.`); }
    catch { setToast("Erro ao ler o arquivo."); }
  };

  const navTo = (t, m = null) => { setTab(t); setModId(m); setTool(null); setResult(""); setInput(""); setFileText(""); setFileName(""); setSidebarOpen(false); };

  const run = async () => {
    if (!tool) return;
    if (left !== "inf" && left <= 0) { setToast("Limite atingido. Faça upgrade!"); return; }
    if (!input.trim() && !fileText) { setToast("Descreva o contexto ou envie um arquivo."); return; }
    setLoading(true); setResult("");

    try {
      const payload = {
        tool: tool.id, module: modId, input: input,
        file_content: fileText || undefined, file_name: fileName || undefined,
        company_name: profile.company_name || undefined, sector: profile.sector || undefined,
        company_size: profile.company_size || undefined, tone: profile.tone || undefined,
        city: profile.city || undefined,
      };

      let response;
      if (tool.upload && fileText) {
        response = await fetch(BACKEND_URL + "/ai/analyze-file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        response = await fetch(BACKEND_URL + "/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }

      const data = await response.json();
      const resultText = data.result || data.response || data.text || JSON.stringify(data);
      setResult(resultText);

      await supabase.from("history").insert({ user_id: user.id, tool: tool.id, module: modId, input: input.substring(0, 500), result: resultText.substring(0, 10000) });
      await supabase.from("profiles").update({ generations_used: (profile.generations_used || 0) + 1 }).eq("id", user.id);
      setProfile(p => ({ ...p, generations_used: (p.generations_used || 0) + 1 }));
      loadHistory();
    } catch (err) {
      setResult("Erro ao processar a análise. Tente novamente.\n\n" + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#050508" }}>
      <style>{G}</style>
      {showModal && <CompanyProfileModal userId={user.id} onComplete={(d) => { setShowModal(false); if (d) setProfile(p => ({ ...p, ...d, profile_complete: true })); }} />}

      {/* Mobile menu button */}
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* ── SIDEBAR ── */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}><Logo size={13} /></div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          <div style={{ padding: "0 20px 8px", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>Principal</div>
          {[
            { id: "home", label: "Painel", icon: "◎" },
            { id: "hist", label: "Histórico", icon: "◷", badge: history.length > 0 ? history.length : null },
            { id: "plans", label: "Planos", icon: "△", dot: plan.id === "free" },
            { id: "perfil", label: "Minha Empresa", icon: "◉" },
          ].map(item => (
            <div key={item.id} className={`nav-item ${tab === item.id && !modId ? "act" : ""}`} onClick={() => navTo(item.id)}>
              <span style={{ fontSize: 13, width: 16, textAlign: "center", opacity: 0.6 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && <span style={{ marginLeft: "auto", fontSize: 10, background: "rgba(99,102,241,0.1)", color: "#a5b4fc", padding: "2px 8px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.15)" }}>{item.badge}</span>}
              {item.dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b" }} />}
            </div>
          ))}

          <div style={{ padding: "20px 20px 8px", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>Módulos</div>
          {MODULES.map(m => (
            <div key={m.id} className={`nav-item ${modId === m.id ? "act" : ""}`} onClick={() => navTo("mod", m.id)}>
              <span style={{ color: m.color, fontSize: 13, width: 16, textAlign: "center" }}>{m.icon}</span>
              <span style={{ flex: 1 }}>{m.label}</span>
              {!canUse(profile.plan, m.plan) && <span style={{ fontSize: 10 }}>🔒</span>}
            </div>
          ))}
        </div>

        {/* Plan info */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>Plano {plan.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>{left === "inf" ? "Ilimitado" : `${left} de ${limit} restantes`}</div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#6366f1,#818cf8)", borderRadius: 2, transition: "width 0.5s", boxShadow: "0 0 8px rgba(99,102,241,0.5)" }} />
          </div>
          {plan.id !== "gestao" && <div onClick={() => navTo("plans")} style={{ fontSize: 12, color: "#818cf8", cursor: "pointer", marginBottom: 12, fontWeight: 500 }}>Fazer upgrade →</div>}
          <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.1)", borderRadius: 10, color: "#fb7185", fontSize: 12, fontWeight: 500 }}>
            ← Sair da conta
          </button>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className="main-area">
        <div className="topbar">
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>
              {tab === "hist" ? "Histórico" : tab === "plans" ? "Planos" : tab === "perfil" ? "Minha Empresa" : modId ? mod?.label : "Painel de Controle"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 300 }}>
              {tab === "hist" ? "Suas análises recentes" : tab === "plans" ? "Gerencie seu plano" : tab === "perfil" ? "Dados da sua empresa" : modId ? mod?.desc : "Situação do seu negócio"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10, background: "rgba(16,185,129,0.04)" }}>
              <span style={{ position: "relative", display: "flex", width: 7, height: 7 }}>
                <span style={{ position: "absolute", display: "inline-flex", width: "100%", height: "100%", borderRadius: "50%", background: "#34d399", opacity: 0.6, animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }} />
                <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} />
              </span>
              <span style={{ fontSize: 10, color: "#34d399", letterSpacing: "0.12em", fontWeight: 600, textTransform: "uppercase" }}>Online</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{profile.company_name || user.name || user.email}</div>
              <div style={{ fontSize: 10, color: "#818cf8", letterSpacing: "0.1em", textTransform: "uppercase" }}>{plan.name}</div>
            </div>
            <div style={{
              width: 36, height: 36,
              background: "linear-gradient(135deg,#6366f1,#4f46e5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "#fff", borderRadius: 10,
            }}>
              {(user.name || user.email || "U")[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ padding: "28px 32px" }}>
          {/* HOME */}
          {tab === "home" && !modId && (
            <>
              <div style={{ marginBottom: 32 }}>
                <span className="section-label">Painel</span>
                <h2 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: 26, fontWeight: 400, marginBottom: 8, letterSpacing: "-0.01em" }}>Bem-vindo ao Arcane</h2>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 300 }}>Selecione um módulo para começar.</p>
              </div>

              {/* Stats */}
              <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 }}>
                {[
                  { label: "Análises usadas", value: used, sub: left === "inf" ? "Ilimitado" : `de ${limit} no plano`, color: "#fff" },
                  { label: "Horas economizadas", value: `${saved.hours}h`, sub: `≈ R$ ${saved.value} em serviços`, color: "#10b981" },
                  { label: "Seu plano", value: plan.name, sub: `${plan.price}${plan.period}`, color: "#a5b4fc" },
                ].map((s, i) => (
                  <div key={i} className="glass" style={{ borderRadius: 16, padding: 24 }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>{s.label}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 26, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Modules grid */}
              <div className="mods-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {MODULES.map(m => {
                  const locked = !canUse(profile.plan, m.plan);
                  return (
                    <div key={m.id} className="mod-card" onClick={() => { if (locked) { setToast(`Requer plano ${m.plan.toUpperCase()}.`); navTo("plans"); return; } navTo("mod", m.id); }} style={{ opacity: locked ? 0.45 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${m.color}10`, border: `1px solid ${m.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: m.color }}>{m.icon}</div>
                        <PlanTag plan={m.plan} />
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{m.label}</h3>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.6, fontWeight: 300 }}>{m.desc}</p>
                      {locked && <div style={{ marginTop: 12, fontSize: 11, color: "#f59e0b" }}>🔒 Requer upgrade</div>}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* MODULE LIST */}
          {tab === "mod" && modId && !tool && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <button onClick={() => navTo("home")} style={{ background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 12, padding: 0 }}>← Painel</button>
                <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{mod?.label}</span>
              </div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: 22, fontWeight: 400, marginBottom: 6 }}>{mod?.label}</h2>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 300 }}>{mod?.desc}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {mod?.tools.map(t => {
                  const locked = !canUse(profile.plan, mod.plan);
                  return (
                    <div key={t.id} className="tool-row" onClick={() => { if (locked) { setToast(`Requer plano ${mod.plan.toUpperCase()}.`); navTo("plans"); return; } setTool(t); }} style={{ opacity: locked ? 0.45 : 1 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>{t.desc}</div>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#34d399" }}>~{Math.round((TOOL_TIME[t.id] || 60) / 60 * 10) / 10}h ec.</span>
                        {t.upload && <span style={{ fontSize: 10, background: "rgba(16,185,129,0.08)", color: "#34d399", padding: "3px 8px", borderRadius: 6, fontWeight: 600, border: "1px solid rgba(16,185,129,0.15)" }}>UPLOAD</span>}
                        {locked ? <span style={{ fontSize: 12 }}>🔒</span> : <span style={{ fontSize: 12, color: "rgba(255,255,255,0.15)" }}>→</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* TOOL */}
          {tab === "mod" && modId && tool && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <button onClick={() => setTool(null)} style={{ background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 12, padding: 0 }}>← {mod?.label}</button>
                <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{tool.name}</span>
              </div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: 22, fontWeight: 400, marginBottom: 6 }}>{tool.name}</h2>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 300 }}>{tool.desc}</p>
                {profile.company_name && (
                  <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 9999, fontSize: 12, color: "#a5b4fc" }}>
                    ✓ Personalizado para {profile.company_name}
                  </div>
                )}
              </div>
              <div className="tool-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  {tool.upload && (
                    <div style={{ marginBottom: 16 }}>
                      <FieldLabel>Arquivo (opcional)</FieldLabel>
                      <div className={`upload-zone${drag ? " drag" : ""}`}
                        onDragOver={e => { e.preventDefault(); setDrag(true); }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
                        onClick={() => fileRef.current?.click()}>
                        <input ref={fileRef} type="file" accept=".txt,.csv,.xlsx,.xls,.pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                        {fileName ? (
                          <div>
                            <div style={{ fontSize: 14, color: "#34d399", fontWeight: 500, marginBottom: 6 }}>✓ {fileName}</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Clique para trocar</div>
                            <button onClick={e => { e.stopPropagation(); setFileText(""); setFileName(""); }} style={{ marginTop: 8, background: "transparent", color: "#f43f5e", fontSize: 11, padding: 0 }}>Remover</button>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Arraste o arquivo ou clique para selecionar</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)" }}>Suporta: .txt, .csv, .xlsx, .pdf</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <FieldLabel>{tool.upload ? "Contexto adicional" : "Descreva o cenário"}</FieldLabel>
                  <textarea value={input} onChange={e => setInput(e.target.value)}
                    placeholder={tool.upload ? "Descreva o contexto do arquivo..." : "Descreva com detalhes a situação..."}
                    rows={tool.upload ? 5 : 10} style={{ resize: "vertical" }} />
                  <button className="btn-accent" onClick={run} disabled={loading || (!input.trim() && !fileText)} style={{ marginTop: 16, width: "100%", height: 48, fontSize: 14, borderRadius: 14 }}>
                    {loading ? "Processando..." : "Executar análise"}
                  </button>
                  {loading && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ animation: "pulse 1.2s ease infinite", color: "#6366f1", fontSize: 14 }}>▶</span>Analisando...
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <FieldLabel>Resultado da Análise</FieldLabel>
                    {result && <button onClick={() => { navigator.clipboard.writeText(result); setToast("Copiado!"); }} style={{ background: "transparent", color: "#818cf8", fontSize: 11, padding: 0, letterSpacing: "0.1em", fontWeight: 600 }}>COPIAR</button>}
                  </div>
                  <div className="result-box">{result || <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 13 }}>O resultado aparecerá aqui.</span>}</div>
                </div>
              </div>
            </>
          )}

          {/* PERFIL */}
          {tab === "perfil" && <ProfileEditor userId={user.id} profile={profile} onSave={(d) => setProfile(p => ({ ...p, ...d }))} setToast={setToast} />}

          {/* PLANS */}
          {tab === "plans" && (
            <>
              <div style={{ marginBottom: 32 }}>
                <span className="section-label">Planos</span>
                <h2 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: 22, fontWeight: 400, marginBottom: 8 }}>Gerencie seu plano</h2>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 300 }}>
                  Você está no plano <span style={{ color: "#a5b4fc", fontWeight: 500 }}>{plan.name}</span>.
                </p>
              </div>
              <div className="plans-dash-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {PLANS.map(p => (
                  <div key={p.id} className="glass" style={{
                    borderRadius: 20, padding: 28, position: "relative",
                    borderColor: p.id === profile.plan ? "rgba(99,102,241,0.3)" : p.highlight ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.06)",
                    boxShadow: p.highlight ? "0 0 32px rgba(99,102,241,0.08)" : "none",
                    transition: "all 0.4s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = p.id === profile.plan ? "rgba(99,102,241,0.3)" : p.highlight ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.06)"; }}
                  >
                    {p.highlight && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "4px 16px", letterSpacing: "0.15em", borderRadius: 8, whiteSpace: "nowrap", textTransform: "uppercase" }}>Mais escolhido</div>}
                    {p.id === profile.plan && <div style={{ position: "absolute", top: 12, right: 16, fontSize: 10, color: "#a5b4fc", fontWeight: 600, letterSpacing: "0.1em" }}>ATUAL</div>}
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>{p.name}</div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 28, fontWeight: 700, color: p.highlight ? "#a5b4fc" : "#fff" }}>{p.price}</span>
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>{p.period}</span>
                    </div>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "16px 0" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                      {p.features.map((f, fi) => (
                        <div key={fi} style={{ display: "flex", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                          <span style={{ color: "#10b981", flexShrink: 0 }}>✓</span>{f}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { if (p.id === "free") return; window.open(MP_LINKS[p.id], "_blank"); }} disabled={p.id === profile.plan}
                      className={p.highlight ? "btn-accent" : "btn-ghost"}
                      style={{ width: "100%", height: 40, fontSize: 12, borderRadius: 12 }}>
                      {p.id === profile.plan
                        ? "Plano atual"
                        : p.id === "free"
                        ? "Grátis"
                        : p.id === "profissional"
                        ? "Desbloquear Profissional"
                        : p.id === "gestao"
                        ? "Elevar para Gestão"
                        : "Assinar"}
                    </button>
                    {p.id !== "free" && p.id !== profile.plan && <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.15)" }}>PIX · Cartão · Boleto</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* HISTORICO */}
          {tab === "hist" && (
            <>
              <div style={{ marginBottom: 32 }}>
                <span className="section-label">Histórico</span>
                <h2 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: 22, fontWeight: 400, marginBottom: 8 }}>Suas análises recentes</h2>
                {saved.hours > 0 && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 300 }}>Você economizou ~{saved.hours}h (R$ {saved.value})</p>}
              </div>
              {history.length === 0 ? (
                <div className="glass" style={{ borderRadius: 16, padding: 40, textAlign: "center" }}>
                  <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 14, fontWeight: 300 }}>Nenhuma análise realizada ainda. Use um módulo para começar.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: selHist ? "1fr 1fr" : "1fr", gap: 16 }}>
                  <div>
                    {history.map(h => (
                      <div key={h.id} className="tool-row" onClick={() => setSelHist(selHist?.id === h.id ? null : h)} style={{ borderColor: selHist?.id === h.id ? "rgba(99,102,241,0.25)" : undefined }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{h.tool?.replace(/_/g, " ")}</span>
                            <span style={{ fontSize: 11, color: "#34d399" }}>+{Math.round((TOOL_TIME[h.tool] || 60) / 60 * 10) / 10}h</span>
                          </div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 300 }}>{h.input}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selHist && (
                    <div className="glass" style={{ borderRadius: 16, padding: 24, position: "sticky", top: 80 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{selHist.tool?.replace(/_/g, " ")}</div>
                        <button onClick={() => { navigator.clipboard.writeText(selHist.result); setToast("Copiado!"); }} style={{ background: "transparent", color: "#818cf8", fontSize: 11, padding: 0, fontWeight: 600 }}>COPIAR</button>
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic", marginBottom: 12, fontWeight: 300 }}>{selHist.input}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 420, overflowY: "auto", fontWeight: 300 }}>{selHist.result}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT — App
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUser({
          id: session.user.id, email: session.user.email,
          name: profileData?.name || session.user.user_metadata?.name || "",
          plan: profileData?.plan || "free",
        });
        setPage("app");
      }
      setLoading(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUser({
          id: session.user.id, email: session.user.email,
          name: profileData?.name || session.user.user_metadata?.name || "",
          plan: profileData?.plan || "free",
        });
        setPage("app");
      } else if (event === "SIGNED_OUT") {
        setUser(null); setPage("landing");
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setPage("landing");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050508" }}>
        <style>{G}</style>
        <div style={{ textAlign: "center" }}>
          <Logo size={22} />
          <div style={{ marginTop: 24, fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 300, letterSpacing: "0.1em" }}>Carregando...</div>
        </div>
      </div>
    );
  }

  if (page === "app" && user) return <Dashboard user={user} onLogout={handleLogout} />;
  if (page === "login") return <AuthPage mode="login" onSuccess={u => { setUser(u); setPage("app"); }} onSwitch={() => setPage("register")} />;
  if (page === "register") return <AuthPage mode="register" onSuccess={u => { setUser(u); setPage("app"); }} onSwitch={() => setPage("login")} />;
  return <Landing onLogin={() => setPage("login")} onRegister={() => setPage("register")} />;
}