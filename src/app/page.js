"use client";

import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import "@/lib/windowStorage";

const ORANGE = "#E8670A";
const DARK = "#16202e";
const GRAY = "#f4f4f4";

/* ── ACESSO DE ADMINISTRADOR (camada de dissuasão — não é segurança real) ──── */
// AVISO: este código corre no cliente e é visível a quem inspecionar a página.
// Esta camada só impede acesso acidental. Segurança real requer verificação
// do lado do servidor (a implementar com Supabase).
const ADMIN_EMAIL="plannerphysio@gmail.com";
const ADMIN_PASSPHRASE="V1b3c0d1ngrules<3";

/* ── i18n — Português (padrão) e Inglês ──────────────────────────────────── */
async function loadLang(){
  try{ const r=await window.storage.get("ui_lang"); return r?r.value:"pt"; }catch(e){ return "pt"; }
}
async function saveLang(l){ try{ await window.storage.set("ui_lang",l); }catch(e){} }

const I18N={
  pt:{
    tagline:"Prescrição baseada em evidência",
    navPrescricao:"🏥 Prescrição", navHistorico:"📋 Histórico", navAdmin:"🔐 Admin",
    register:"Registar", login:"Login", logout:"↪ Terminar sessão",
    footerTagline:"Ferramenta de apoio à prescrição de exercício · A decisão clínica é sempre da responsabilidade do profissional de saúde.",
    footerDisclaimer:"Esta aplicação não substitui avaliação ou julgamento clínico. Confirma sempre as referências científicas antes de as utilizares.",
    footerCredit:"Desenvolvido por Rodrigo Severina em conjunto com Claude",
    clinicalDisclaimer:"⚕️ Aviso clínico: Esta ferramenta é um apoio à decisão e não substitui o julgamento clínico. A decisão final sobre a prescrição é sempre da responsabilidade do profissional de saúde. Os planos gerados devem ser revistos e adaptados a cada caso, e as referências científicas confirmadas antes de utilizadas. Não existem planos ideais — apenas planos adaptados ao contexto individual.",
    formIntro:"Preenche os dados clínicos do paciente para gerar um plano personalizado com evidência científica.",
    ownGuidelinesActive:"guideline(s) própria(s) ativa(s)",
    idade:"Idade (anos)", genero:"Género", profissao:"Profissão", profissaoPh:"Ex: Escriturário, Construtor civil…",
    masculino:"Masculino", feminino:"Feminino", outroGenero:"Outro",
    patologia:"Patologia", faseLesao:"Fase da lesão",
    especificaPatologia:"Especifica a patologia", especificaPatologiaPh:"Ex: Síndrome do Canal Cárpico",
    testesEspeciais:"Testes especiais realizados com resultado positivo",
    testesEspeciaisPh:"Ex: Lasègue positivo, Slump Test positivo. Escreve NA se não aplicável.",
    testesEspeciaisNota:"Escreve os testes positivos separados por vírgula, ou NA se não foram realizados.",
    problemaPaciente:"Problema referido pelo utente", problemaPacientePh:"Ex: Dor ao subir escadas, limitação a andar…",
    problemaFisio:"Avaliação do fisioterapeuta", problemaFisioPh:"Ex: Fraqueza do quadricípite, défice de proprioceção…",
    outrosFatores:"Outros fatores relevantes (comorbilidades, medicação)", outrosFatoresPh:"Ex: Diabetes tipo 2, anti-inflamatórios… ou N/A",
    fatorHistorico:"Fator histórico / objetivo pessoal do utente", fatorHistoricoPh:"Ex: Era nadador federado e quer voltar a nadar…",
    continuar:"Continuar → Selecionar Objetivo(s) Terapêutico(s)",
    confirmacaoPerfil:"Confirmação do perfil", patologiaLbl:"Patologia", faseLbl:"Fase", idadeLbl:"Idade", generoLbl:"Género",
    objetivoTitulo:"Objetivo(s) terapêutico(s)", objetivoSub:"Seleciona até 2 objetivos — serão gerados 4–5 exercícios por cada um.",
    selecionado:"Selecionado", podeAdicionarMais:"(podes adicionar mais 1)",
    voltar:"← Voltar", gerarPlano:"Gerar plano —", selecionaObjetivo:"Seleciona pelo menos 1 objetivo",
    aVerificarGerar:"A pesquisar em fontes científicas e a gerar plano personalizado…",
    novoplano:"← Novo plano", guardar:"💾 Guardar", guardarEntrar:"💾 Guardar (entrar)", aguardar:"A guardar…", guardado:"✓ Guardado",
    editar:"✏️ Editar", concluirEdicao:"✓ Concluir edição", pdf:"⬇ PDF",
    tabUtente:"👤 Plano Utente", tabFisio:"🩺 Vista Fisioterapeuta", tabInfografico:"🖼️ Infográfico IA",
    fontes:"Fontes:", validacaoRefs:"🔬 Validação de referências (PubMed):",
    modoEdicao:"✏️ Modo de edição ativo. Altera os campos diretamente. As mudanças refletem-se no PDF e no infográfico.",
    planoTreino:"Plano de Treino", cuidados:"Cuidados a ter", redFlags:"Red Flags", yellowFlags:"Yellow Flags",
    adicionarExercicio:"+ Adicionar exercício", adicionar:"+ Adicionar",
    verDemo:"▶️ Ver demonstração do exercício", procurarYoutube:"🔍 Procurar demonstração no YouTube",
    resumoClinico:"Resumo Clínico", planoEstruturado:"Plano Estruturado com Guidelines",
    justificacaoClinica:"Justificação clínica:", guideline:"Guideline:",
    artigosGuidelines:"Artigos e guidelines consultados:",
    infograficoTitulo:"🖼️ Gerar Infográfico com IA",
    infograficoDesc:"Copia o prompt e cola no ChatGPT ou no Gemini para gerar o infográfico clínico visual. Usas a tua própria conta e créditos.",
    copiarPrompt:"📋 Copiar prompt", promptCopiado:"✓ Prompt copiado!",
    abrirChatGPT:"Copiar + abrir ChatGPT →", abrirGemini:"Copiar + abrir Gemini →",
    comoUsar:"Como usar:",
    historicoTitulo:"Histórico disponível com conta", historicoSub:"Inicia sessão ou cria uma conta para guardar os teus planos e voltar a eles mais tarde.",
    entrarRegistar:"Entrar / Registar", semPlanos:"Ainda não há planos guardados", semPlanosSub:"Quando gerares um plano, podes guardá-lo no histórico para voltar a consultá-lo aqui.",
    abrir:"Abrir", eliminar:"Eliminar",
    patologiaForaAmbito:"Patologia fora do âmbito", voltarCorrigir:"← Voltar e corrigir",
    rgpdTitulo:"🔒 Proteção de dados (RGPD) — como tratar os dados do paciente",
    adminArea:"Área de administração", adminSub:"Introduz a frase-passe para aceder à gestão de guidelines e ao banco de exercícios.",
    fraseP:"Frase-passe", desbloquear:"Desbloquear", bloquear:"🔒 Bloquear",
    langLabel:"Idioma",
  },
  en:{
    tagline:"Evidence-based exercise prescription",
    navPrescricao:"🏥 Prescription", navHistorico:"📋 History", navAdmin:"🔐 Admin",
    register:"Sign up", login:"Log in", logout:"↪ Log out",
    footerTagline:"Exercise prescription support tool · Clinical decisions remain the responsibility of the healthcare professional.",
    footerDisclaimer:"This application does not replace clinical assessment or judgement. Always confirm scientific references before use.",
    footerCredit:"Developed by Rodrigo Severina together with Claude",
    clinicalDisclaimer:"⚕️ Clinical notice: This tool is a decision-support aid and does not replace clinical judgement. The final prescription decision always rests with the healthcare professional. Generated plans should be reviewed and adapted to each case, and scientific references confirmed before use. There is no single ideal plan — only plans adapted to the individual context.",
    formIntro:"Fill in the patient's clinical data to generate a personalized, evidence-based plan.",
    ownGuidelinesActive:"active custom guideline(s)",
    idade:"Age (years)", genero:"Gender", profissao:"Occupation", profissaoPh:"e.g. Office clerk, Construction worker…",
    masculino:"Male", feminino:"Female", outroGenero:"Other",
    patologia:"Condition", faseLesao:"Injury stage",
    especificaPatologia:"Specify the condition", especificaPatologiaPh:"e.g. Carpal Tunnel Syndrome",
    testesEspeciais:"Special tests performed with a positive result",
    testesEspeciaisPh:"e.g. Positive Lasègue, positive Slump Test. Write N/A if not applicable.",
    testesEspeciaisNota:"List positive tests separated by commas, or N/A if none were performed.",
    problemaPaciente:"Problem reported by the patient", problemaPacientePh:"e.g. Pain climbing stairs, limited walking…",
    problemaFisio:"Physiotherapist's assessment", problemaFisioPh:"e.g. Quadriceps weakness, proprioceptive deficit…",
    outrosFatores:"Other relevant factors (comorbidities, medication)", outrosFatoresPh:"e.g. Type 2 diabetes, anti-inflammatories… or N/A",
    fatorHistorico:"Historical factor / patient's personal goal", fatorHistoricoPh:"e.g. Was a competitive swimmer and wants to return to swimming…",
    continuar:"Continue → Select Therapeutic Goal(s)",
    confirmacaoPerfil:"Profile confirmation", patologiaLbl:"Condition", faseLbl:"Stage", idadeLbl:"Age", generoLbl:"Gender",
    objetivoTitulo:"Therapeutic goal(s)", objetivoSub:"Select up to 2 goals — 4–5 exercises will be generated for each.",
    selecionado:"Selected", podeAdicionarMais:"(you can add 1 more)",
    voltar:"← Back", gerarPlano:"Generate plan —", selecionaObjetivo:"Select at least 1 goal",
    aVerificarGerar:"Searching scientific sources and generating a personalized plan…",
    novoplano:"← New plan", guardar:"💾 Save", guardarEntrar:"💾 Save (log in)", aguardar:"Saving…", guardado:"✓ Saved",
    editar:"✏️ Edit", concluirEdicao:"✓ Finish editing", pdf:"⬇ PDF",
    tabUtente:"👤 Patient Plan", tabFisio:"🩺 Physiotherapist View", tabInfografico:"🖼️ AI Infographic",
    fontes:"Sources:", validacaoRefs:"🔬 Reference validation (PubMed):",
    modoEdicao:"✏️ Edit mode active. Change fields directly. Changes are reflected in the PDF and infographic.",
    planoTreino:"Exercise Plan", cuidados:"Precautions", redFlags:"Red Flags", yellowFlags:"Yellow Flags",
    adicionarExercicio:"+ Add exercise", adicionar:"+ Add",
    verDemo:"▶️ Watch exercise demonstration", procurarYoutube:"🔍 Search for a demonstration on YouTube",
    resumoClinico:"Clinical Summary", planoEstruturado:"Structured Plan with Guidelines",
    justificacaoClinica:"Clinical rationale:", guideline:"Guideline:",
    artigosGuidelines:"Articles and guidelines consulted:",
    infograficoTitulo:"🖼️ Generate AI Infographic",
    infograficoDesc:"Copy the prompt and paste it into ChatGPT or Gemini to generate the visual clinical infographic. You use your own account and credits.",
    copiarPrompt:"📋 Copy prompt", promptCopiado:"✓ Prompt copied!",
    abrirChatGPT:"Copy + open ChatGPT →", abrirGemini:"Copy + open Gemini →",
    comoUsar:"How to use:",
    historicoTitulo:"History available with an account", historicoSub:"Log in or create an account to save your plans and come back to them later.",
    entrarRegistar:"Log in / Sign up", semPlanos:"No plans saved yet", semPlanosSub:"When you generate a plan, you can save it to your history to revisit it here.",
    abrir:"Open", eliminar:"Delete",
    patologiaForaAmbito:"Condition out of scope", voltarCorrigir:"← Go back and correct",
    rgpdTitulo:"🔒 Data protection (GDPR) — how to handle patient data",
    adminArea:"Admin area", adminSub:"Enter the passphrase to access guideline management and the exercise bank.",
    fraseP:"Passphrase", desbloquear:"Unlock", bloquear:"🔒 Lock",
    langLabel:"Language",
  }
};
function tr(lang,key){ return (I18N[lang]&&I18N[lang][key]) || I18N.pt[key] || key; }

function LangSwitch({lang,onChange,dark=true}){
  return (
    <div style={{display:"flex",border:`1px solid ${dark?"#444":"#ddd"}`,borderRadius:7,overflow:"hidden"}}>
      {["pt","en"].map(l=>(
        <button key={l} onClick={()=>onChange(l)} style={{
          padding:"4px 9px",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,
          background:lang===l?ORANGE:"transparent",
          color:lang===l?"#fff":(dark?"#aaa":"#888")
        }}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}

/* ── LOGO — Physio Planner (coruja com cruz médica) ──────────────────────── */
const OwlIcon = ({ size = 40, light = false }) => {
  const stroke = light ? "#ffffff" : "#16202e";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">
      {/* head top + ears */}
      <path d="M30 30 Q28 18 38 20 L46 26 M70 30 Q72 18 62 20 L54 26"
        stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* brow line */}
      <path d="M30 30 Q50 24 70 30" stroke={stroke} strokeWidth="5" strokeLinecap="round"/>
      {/* body outline */}
      <path d="M30 30 Q24 52 30 70 Q38 86 50 86 Q62 86 70 70 Q76 52 70 30"
        stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* left eye (P-shape) */}
      <path d="M36 40 Q46 40 46 47 Q46 53 38 53 L38 62" stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* right eye */}
      <path d="M64 40 Q54 40 54 47 Q54 53 62 53 L62 62" stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* belly feathers */}
      <path d="M44 62 Q44 72 50 76 Q56 72 56 62" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      {/* feet */}
      <path d="M42 86 L40 92 M58 86 L60 92" stroke={stroke} strokeWidth="5" strokeLinecap="round"/>
      {/* orange medical cross */}
      <g fill={ORANGE}>
        <rect x="46" y="46" width="8" height="20" rx="1.5"/>
        <rect x="40" y="52" width="20" height="8" rx="1.5"/>
      </g>
    </svg>
  );
};

const Logo = ({ height = 36, dark = false }) => {
  const txt = dark ? "#16202e" : "#ffffff";
  return (
    <div style={{display:"flex",alignItems:"center",gap:9}}>
      <OwlIcon size={height} light={!dark}/>
      <span style={{fontFamily:"Arial, sans-serif",fontWeight:800,fontSize:height*0.5,color:txt,letterSpacing:0.3,whiteSpace:"nowrap"}}>
        Physio <span style={{fontWeight:400}}>Planner</span>
      </span>
    </div>
  );
};

/* ── CONSTANTS ────────────────────────────────────────────────────────────── */
const PHASE_LABELS = {
  aguda:    "Aguda (0–6 semanas)",
  subaguda: "Subaguda (6–12 semanas)",
  cronica:  "Crónica (>12 semanas)",
};
const PHASE_LABELS_EN = {
  aguda:    "Acute (0–6 weeks)",
  subaguda: "Subacute (6–12 weeks)",
  cronica:  "Chronic (>12 weeks)",
};
const phaseLabel=(k,lang)=> (lang==="en"?PHASE_LABELS_EN:PHASE_LABELS)[k]||k;

const OBJETIVOS = [
  { key:"controlo_motor", label:"Controlo motor",      icon:"🎯", desc:"Estabilização e coordenação profunda",    presc:"2–3 séries · 8–12 reps · 20–40% 1RM · descanso 60 s",
    label_en:"Motor control", desc_en:"Deep stabilization and coordination", presc_en:"2–3 sets · 8–12 reps · 20–40% 1RM · 60 s rest" },
  { key:"forca",          label:"Força muscular",       icon:"💪", desc:"Ganho de força máxima e funcional",       presc:"3–5 séries · 3–6 reps · 75–85% 1RM · descanso 2–3 min",
    label_en:"Muscular strength", desc_en:"Maximal and functional strength gains", presc_en:"3–5 sets · 3–6 reps · 75–85% 1RM · 2–3 min rest" },
  { key:"hipertrofia",    label:"Hipertrofia",          icon:"📈", desc:"Aumento da massa muscular",               presc:"3–4 séries · 8–12 reps · 65–75% 1RM · descanso 60–90 s",
    label_en:"Hypertrophy", desc_en:"Increase in muscle mass", presc_en:"3–4 sets · 8–12 reps · 65–75% 1RM · 60–90 s rest" },
  { key:"resistencia",    label:"Resistência",          icon:"🔄", desc:"Capacidade aeróbia e tolerância",         presc:"2–4 séries · 15–25 reps ou 30–60 s · <50% 1RM · descanso 30–45 s",
    label_en:"Endurance", desc_en:"Aerobic capacity and tolerance", presc_en:"2–4 sets · 15–25 reps or 30–60 s · <50% 1RM · 30–45 s rest" },
  { key:"flexibilidade",  label:"Flexibilidade",        icon:"🤸", desc:"Amplitude articular e elasticidade",      presc:"3–5 séries · sustentação 30–60 s · sem carga",
    label_en:"Flexibility", desc_en:"Joint range of motion and elasticity", presc_en:"3–5 sets · hold 30–60 s · no load" },
  { key:"potencia",       label:"Potência / Desporto",  icon:"⚡", desc:"Explosividade e retorno ao desporto",    presc:"3–5 séries · 3–6 reps explosivas · 50–70% 1RM · descanso 2–3 min",
    label_en:"Power / Return to sport", desc_en:"Explosiveness and return to sport", presc_en:"3–5 sets · 3–6 explosive reps · 50–70% 1RM · 2–3 min rest" },
];
const objLabel=(o,lang)=> lang==="en"?o.label_en:o.label;
const objDesc=(o,lang)=> lang==="en"?o.desc_en:o.desc;
const objPresc=(o,lang)=> lang==="en"?o.presc_en:o.presc;

const PATHOLOGIES = [
  "Lombalgia","Cervicalgia","Tendinopatia do Tendão de Aquiles",
  "Lesão do Menisco","Síndrome Femoropatelar","Lesão do Manguito Rotador",
  "Epicondilalgia Lateral (Cotovelo de Tenista)","Fasceíte Plantar",
  "Distensão Muscular","Artrose do Joelho","Artrose da Anca",
  "Hérnia Discal Lombar","Hérnia Discal Cervical","Espondilartrose",
  "Síndrome do Canal Cárpico","Entorse do Tornozelo","Rotura do LCA",
  "Bursite do Ombro","Síndrome do Impingement do Ombro",
  "Fratura (pós-imobilização)","Outra patologia musculoesquelética",
];
// Tradução apenas de EXIBIÇÃO — o valor interno guardado/usado na IA e no banco de exercícios mantém-se em PT
const PATHOLOGIES_EN={
  "Lombalgia":"Low back pain","Cervicalgia":"Neck pain","Tendinopatia do Tendão de Aquiles":"Achilles Tendinopathy",
  "Lesão do Menisco":"Meniscus Injury","Síndrome Femoropatelar":"Patellofemoral Pain Syndrome","Lesão do Manguito Rotador":"Rotator Cuff Injury",
  "Epicondilalgia Lateral (Cotovelo de Tenista)":"Lateral Epicondylalgia (Tennis Elbow)","Fasceíte Plantar":"Plantar Fasciitis",
  "Distensão Muscular":"Muscle Strain","Artrose do Joelho":"Knee Osteoarthritis","Artrose da Anca":"Hip Osteoarthritis",
  "Hérnia Discal Lombar":"Lumbar Disc Herniation","Hérnia Discal Cervical":"Cervical Disc Herniation","Espondilartrose":"Spondylarthrosis",
  "Síndrome do Canal Cárpico":"Carpal Tunnel Syndrome","Entorse do Tornozelo":"Ankle Sprain","Rotura do LCA":"ACL Tear",
  "Bursite do Ombro":"Shoulder Bursitis","Síndrome do Impingement do Ombro":"Shoulder Impingement Syndrome",
  "Fratura (pós-imobilização)":"Fracture (post-immobilization)","Outra patologia musculoesquelética":"Other musculoskeletal condition",
};
const pathoLabel=(p,lang)=> lang==="en"?(PATHOLOGIES_EN[p]||p):p;

const MSK_KW = ["lombalgia","cervical","tendin","menisco","patelo","manguito","epicondil","fasceíte","distensão","artrose","hérnia","espondilar","cárpico","entorse","lca","bursite","impingement","fratura","muscular","ligamento","tendão","articular","joelho","ombro","tornozelo","anca","coluna","lombar","dorsal","ísquio","quadricep","fisio","reabilita","ortoped","cotovelo","punho",
  // English terms (para quando a app está em inglês)
  "back pain","neck","knee","shoulder","ankle","hip","elbow","wrist","spine","lumbar","sprain","strain","rotator cuff","acl","meniscus","fracture","arthritis","tendinopathy","tendinitis","bursitis","impingement","carpal tunnel","disc","herniat","muscle","joint","physio","rehab","orthop"];
const isMSK = p => MSK_KW.some(k => p.toLowerCase().includes(k));

const EX_ICONS = ["🧘","🏃","💪","🦵","🔄","🤸","⚡","🏋️","🎯","📐","🦶","🖐️"];

/* ── VIDEO / DEMO LINKS ───────────────────────────────────────────────────── */
function youtubeSearchUrl(exerciseName,patologia){
  const q=encodeURIComponent(`${exerciseName} exercício fisioterapia ${patologia||""}`.trim());
  return `https://www.youtube.com/results?search_query=${q}`;
}
function googleImagesUrl(exerciseName){
  const q=encodeURIComponent(`${exerciseName} exercício fisioterapia`);
  return `https://www.google.com/search?tbm=isch&q=${q}`;
}
function geminiImagePrompt(exerciseName){
  return `${exerciseName} imagem semi realista fundo branco`;
}
function isValidUrl(u){
  if(!u) return false;
  try{ const x=new URL(u); return x.protocol==="http:"||x.protocol==="https:"; }catch(e){ return false; }
}

function BrokenImagePlaceholder({size=70}) {
  return (
    <div title="A imagem não carregou — verifica o link no banco de exercícios" style={{width:size,height:size,borderRadius:8,border:"1.5px dashed #f0b0b0",background:"#fdf5f5",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,gap:2}}>
      <span style={{fontSize:size>50?18:12,color:"#e08080"}}>🖼️✕</span>
      {size>50&&<span style={{fontSize:8,color:"#c0392b",textAlign:"center",padding:"0 4px"}}>imagem indisponível</span>}
    </div>
  );
}

function SmartImage({src,fallbackSrc,alt,size=70,rounded=8}) {
  const [stage,setStage]=useState(0); // 0=src, 1=fallback, 2=failed
  const current = stage===0 ? src : stage===1 ? fallbackSrc : null;
  if(!current) return <BrokenImagePlaceholder size={size}/>;
  return <img src={current} alt={alt||""} style={{width:size,height:size,objectFit:"cover",borderRadius:rounded,border:"1px solid #eee"}}
    onError={()=>setStage(s=>{
      if(s===0&&fallbackSrc&&fallbackSrc!==src) return 1;
      return 2;
    })}/>;
}

/* ── Repara aspas duplas a meio de valores de texto no JSON ───────────────── */
function repairJsonQuotes(s){
  // Percorre o JSON carácter a carácter. Quando está dentro de uma string,
  // se encontrar uma aspa dupla que NÃO é seguida por um delimitador estrutural
  // (: , } ] ou fim), assume que é uma aspa interna e escapa-a.
  let out="";
  let inStr=false;
  for(let i=0;i<s.length;i++){
    const ch=s[i];
    const prev=s[i-1];
    if(ch==='"'&&prev!=="\\"){
      if(!inStr){ inStr=true; out+=ch; continue; }
      // estamos dentro de uma string e encontrámos uma aspa
      // olhar para o próximo carácter não-espaço
      let j=i+1;
      while(j<s.length&&(s[j]===" "||s[j]==="\n"||s[j]==="\r"||s[j]==="\t")) j++;
      const next=s[j];
      if(next===":"||next===","||next==="}"||next==="]"||next===undefined){
        // aspa de fecho legítima
        inStr=false; out+=ch; continue;
      } else {
        // aspa interna — escapar
        out+='\\"'; continue;
      }
    }
    out+=ch;
  }
  return out;
}

/* ── DISCLAIMER + RGPD ────────────────────────────────────────────────────── */
function ClinicalDisclaimer({compact=false,t}) {
  const txt = t ? t("clinicalDisclaimer") : "⚕️ Aviso clínico: Esta ferramenta é um apoio à decisão e não substitui o julgamento clínico. A decisão final sobre a prescrição é sempre da responsabilidade do profissional de saúde. Os planos gerados devem ser revistos e adaptados a cada caso, e as referências científicas confirmadas antes de utilizadas. Não existem planos ideais — apenas planos adaptados ao contexto individual.";
  return (
    <div style={{marginTop:18,padding:compact?"8px 12px":"11px 14px",background:"#fbfbfb",border:"1px solid #e8e8e8",borderRadius:8,fontSize:compact?10:11,color:"#888",lineHeight:1.5}}>
      {txt}
    </div>
  );
}

function RGPDNotice({t,lang}) {
  const [open,setOpen]=useState(false);
  const isEn = lang==="en";
  return (
    <div style={{background:"#f4f7fb",border:"1px solid #d6e2f0",borderRadius:8,padding:"9px 13px",marginBottom:12,fontSize:11,color:"#3a546e"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <span><b>{t?t("rgpdTitulo"):"🔒 Proteção de dados (RGPD) — como tratar os dados do paciente"}</b></span>
        <span style={{fontSize:9}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{marginTop:8,lineHeight:1.6}}>
          {isEn ? (
            <>
              <p style={{marginBottom:6}}>To comply with GDPR when using this tool with real patient data:</p>
              <ul style={{margin:0,paddingLeft:16}}>
                <li style={{marginBottom:3}}>Obtain <b>informed consent</b> from the patient before entering their clinical data.</li>
                <li style={{marginBottom:3}}>Avoid entering data that directly identifies the patient (name, ID number). Use only what's needed to generate the plan.</li>
                <li style={{marginBottom:3}}>Data entered is sent to an AI service to generate the plan. Inform the patient of this processing.</li>
                <li>Store exported plans securely and in line with your data protection policy.</li>
              </ul>
              <p style={{marginTop:6,fontSize:10,color:"#7089a3"}}>Note: in this prototype, data is not stored on a server. In production, define where and how data is stored, retention periods, and data subject rights.</p>
            </>
          ):(
            <>
              <p style={{marginBottom:6}}>Para cumprir o RGPD ao usar esta ferramenta com dados reais de pacientes:</p>
              <ul style={{margin:0,paddingLeft:16}}>
                <li style={{marginBottom:3}}>Recolhe <b>consentimento informado</b> do paciente antes de introduzir os seus dados clínicos.</li>
                <li style={{marginBottom:3}}>Evita inserir dados que identifiquem diretamente o paciente (nome, nº de utente). Usa apenas o necessário para gerar o plano.</li>
                <li style={{marginBottom:3}}>Os dados introduzidos são enviados a um serviço de IA para gerar o plano. Informa o paciente deste tratamento.</li>
                <li>Guarda os planos exportados de forma segura e em conformidade com a tua política de proteção de dados.</li>
              </ul>
              <p style={{marginTop:6,fontSize:10,color:"#7089a3"}}>Nota: neste protótipo os dados não são guardados em servidor. Em produção, define onde e como os dados são armazenados, o prazo de retenção e os direitos do titular.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── PMID VALIDATION (PubMed E-utilities — API oficial NCBI) ──────────────── */
function extractPMID(link){
  if(!link) return null;
  // matches /12345678/ or pubmed.ncbi.nlm.nih.gov/12345678 or ?term=12345678
  const m=String(link).match(/(?:pubmed\.ncbi\.nlm\.nih\.gov\/|\/)(\d{6,9})\b/) || String(link).match(/\b(\d{6,9})\b/);
  return m?m[1]:null;
}

// Returns {status:"verified"|"mismatch"|"notfound"|"nopmid"|"error", title, authors, year, journal, pmid}
async function validatePMID(pmid, citedRef){
  if(!pmid) return {status:"nopmid"};
  try{
    const url=`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`;
    const res=await fetch(url);
    if(!res.ok) return {status:"error",pmid};
    const data=await res.json();
    const rec=data?.result?.[pmid];
    if(!rec || rec.error) return {status:"notfound",pmid};
    const title=rec.title||"";
    const year=(rec.pubdate||"").match(/\d{4}/)?.[0]||"";
    const journal=rec.fulljournalname||rec.source||"";
    const firstAuthor=rec.authors?.[0]?.name||"";
    // Heurística rigorosa: a referência citada tem de corresponder ao registo real.
    let status="verified";
    if(citedRef){
      const refLower=citedRef.toLowerCase();
      const authorSurname=firstAuthor.split(" ")[0]?.toLowerCase()||"";
      const yearMatch=year&&refLower.includes(year);
      const authorMatch=authorSurname&&authorSurname.length>2&&refLower.includes(authorSurname);
      // Exigência forte: o apelido do primeiro autor real TEM de aparecer na referência citada.
      // Se o autor real não bate certo, é provavelmente um PMID que existe mas foi mal atribuído.
      if(authorSurname&&authorSurname.length>2){
        if(!authorMatch) status="mismatch";
      } else if(year&&!yearMatch){
        status="mismatch";
      }
    } else {
      // Sem referência citada para comparar — não conseguimos confirmar correspondência
      status="mismatch";
    }
    return {status,pmid,title,year,journal,firstAuthor};
  }catch(e){
    return {status:"error",pmid};
  }
}

function PMIDBadge({state}){
  if(!state) return <span style={{fontSize:10,color:"#aaa"}}>⏳ a verificar…</span>;
  const map={
    verified:{bg:"#e8f5e9",fg:"#2e7d32",icon:"✓",label:"Verificado no PubMed"},
    mismatch:{bg:"#fff8e1",fg:"#f57f17",icon:"⚠",label:"Referência a confirmar"},
    notfound:{bg:"#ffebee",fg:"#c62828",icon:"✗",label:"PMID não encontrado"},
    nopmid:{bg:"#f5f5f5",fg:"#888",icon:"?",label:"Sem PMID — não verificável"},
    error:{bg:"#f5f5f5",fg:"#888",icon:"⚠",label:"Verificação indisponível"},
  };
  const s=map[state.status]||map.error;
  return (
    <span title={state.title?`${state.title} (${state.firstAuthor}, ${state.year}) — ${state.journal}`:s.label}
      style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,background:s.bg,color:s.fg,borderRadius:5,padding:"1px 7px",fontWeight:600}}>
      {s.icon} {s.label}
      {state.status==="verified"&&state.firstAuthor&&<span style={{opacity:0.7,fontWeight:400}}>· {state.firstAuthor} {state.year}</span>}
    </span>
  );
}

/* ── AUTH (demo local — em produção usar Firebase/Supabase/Auth0) ─────────── */
async function loadUsers(){
  try{ const r=await window.storage.get("physioplanner_users"); return r?JSON.parse(r.value):{}; }
  catch(e){ return {}; }
}
async function saveUsers(users){
  try{ await window.storage.set("physioplanner_users",JSON.stringify(users)); }catch(e){}
}
async function loadSession(){
  try{ const r=await window.storage.get("physioplanner_session"); return r?JSON.parse(r.value):null; }
  catch(e){ return null; }
}
async function saveSession(s){
  try{ if(s) await window.storage.set("physioplanner_session",JSON.stringify(s)); else await window.storage.delete("physioplanner_session"); }catch(e){}
}
// simple hash (NOT secure — demo only)
function hashPw(pw){ let h=0; for(let i=0;i<pw.length;i++){h=((h<<5)-h+pw.charCodeAt(i))|0;} return String(h); }

/* ── PLAN HISTORY (local — pronto para migrar para Supabase) ──────────────── */
// Estrutura preparada para Supabase: table "plans" { id, user_email, created_at, patient_data, objetivos, result }
async function loadHistory(email){
  if(!email) return [];
  try{ const r=await window.storage.get(`physioplanner_history_${email}`); return r?JSON.parse(r.value):[]; }
  catch(e){ return []; }
}
async function saveHistory(email,plans){
  if(!email) return;
  try{ await window.storage.set(`physioplanner_history_${email}`,JSON.stringify(plans)); }catch(e){}
}
async function addPlanToHistory(email,plan){
  const hist=await loadHistory(email);
  const entry={
    id:Date.now(),
    created_at:new Date().toISOString(),
    patient_data:plan.patientData,
    objetivos:plan.objetivos,
    result:plan.result,
  };
  const updated=[entry,...hist].slice(0,100); // keep last 100
  await saveHistory(email,updated);
  return entry;
}
async function deletePlanFromHistory(email,id){
  const hist=await loadHistory(email);
  const updated=hist.filter(p=>p.id!==id);
  await saveHistory(email,updated);
  return updated;
}

/* ── BANCO DE EXERCÍCIOS (Cloudinary + CSV) ────────────────────────────────── */
// Estrutura de cada linha esperada:
// Nome canónico | Sinónimos / variações | Categoria / zona corporal | Link da imagem |
// Link do vídeo | Instrução curta padronizada | Tipo de exercício | Patologias associadas comuns | Fonte clínica principal

async function loadExerciseLibrary(){
  try{ const r=await window.storage.get("exercise_library",true); return r?JSON.parse(r.value):[]; }
  catch(e){ return []; }
}
async function saveExerciseLibrary(list){
  try{ await window.storage.set("exercise_library",JSON.stringify(list),true); }catch(e){}
}

function normalizeText(s){
  if(!s) return "";
  return s.toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g," ")
    .replace(/\s+/g," ")
    .trim();
}

// Aplica otimização automática do Cloudinary (formato + qualidade + largura) sem alterar o ficheiro original
function cloudinaryOptimize(url,params="f_auto,q_auto,w_500"){
  if(!url) return url;
  if(!url.includes("res.cloudinary.com")) return url; // não mexe em URLs de outras origens
  if(url.includes("/upload/f_auto")||url.includes("/upload/q_auto")) return url; // já otimizado
  return url.replace("/upload/",`/upload/${params}/`);
}

function parseExerciseCsv(text){
  const result=Papa.parse(text,{header:true,skipEmptyLines:true,dynamicTyping:false,delimitersToGuess:[",",";","\t"]});
  const rows=result.data||[];
  const norm=h=>normalizeText(h);
  return rows.map(row=>{
    // Mapear colunas de forma tolerante a pequenas variações de nome/maiúsculas
    const get=(...keys)=>{
      for(const k of Object.keys(row)){
        const nk=norm(k);
        if(keys.some(target=>nk.includes(norm(target)))) return (row[k]||"").toString().trim();
      }
      return "";
    };
    const nome=get("nome canonico","nome canónico","nome");
    if(!nome) return null;
    const sinonimosRaw=get("sinonimos","sinónimos","variações","variacoes");
    return {
      nome,
      sinonimos:sinonimosRaw?sinonimosRaw.split(",").map(s=>s.trim()).filter(Boolean):[],
      categoria:get("categoria","zona corporal"),
      imagem:get("link da imagem","imagem"),
      video:get("link do video","link do vídeo","video"),
      instrucao:get("instrucao","instrução"),
      tipo:get("tipo de exercicio","tipo de exercício"),
      patologias:get("patologias associadas"),
      fonte:get("fonte clinica","fonte clínica"),
    };
  }).filter(Boolean);
}

// Corresponde o nome de um exercício gerado pela IA a uma entrada da biblioteca.
// Política: só corresponde em caso de igualdade EXATA (nome canónico ou sinónimo, normalizados).
// Nunca faz correspondência aproximada — mostrar a imagem errada é pior do que não mostrar nenhuma.
// Exceção controlada: a IA por vezes escreve "Nome Principal (tradução/variante)" — testamos
// também a parte antes do parêntesis, continuando a exigir igualdade exata nessa parte.
function matchExercise(exerciseName,library){
  if(!exerciseName||!library||library.length===0) return null;
  const candidates=[exerciseName];
  const beforeParen=exerciseName.split("(")[0].trim();
  if(beforeParen&&beforeParen!==exerciseName) candidates.push(beforeParen);
  const insideParen=exerciseName.match(/\(([^)]+)\)/)?.[1];
  if(insideParen) candidates.push(insideParen.trim());

  for(const candidate of candidates){
    const target=normalizeText(candidate);
    if(!target) continue;
    for(const entry of library){
      if(normalizeText(entry.nome)===target) return entry;
      for(const syn of entry.sinonimos){
        if(normalizeText(syn)===target) return entry;
      }
    }
  }
  return null;
}

function AuthModal({mode,onClose,onAuth,t,lang}){
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [name,setName]=useState("");
  const [err,setErr]=useState("");
  const [tab,setTab]=useState(mode); // login | register
  const [busy,setBusy]=useState(false);

  const submit=async()=>{
    setErr("");
    if(!email||!pw){setErr(lang==="en"?"Fill in both email and password.":"Preenche email e password.");return;}
    if(!/^[^@]+@[^@]+\.[^@]+$/.test(email)){setErr(lang==="en"?"Invalid email.":"Email inválido.");return;}
    if(tab==="register"&&pw.length<6){setErr(lang==="en"?"Password must be at least 6 characters.":"A password deve ter pelo menos 6 caracteres.");return;}
    setBusy(true);
    const users=await loadUsers();
    if(tab==="register"){
      if(users[email]){setErr(lang==="en"?"An account with this email already exists.":"Já existe uma conta com este email.");setBusy(false);return;}
      users[email]={email,name:name||email.split("@")[0],pw:hashPw(pw),provider:"email"};
      await saveUsers(users);
      const sess={email,name:users[email].name,provider:"email"};
      await saveSession(sess); onAuth(sess);
    } else {
      const u=users[email];
      if(!u){setErr(lang==="en"?"Account not found. Sign up first.":"Conta não encontrada. Regista-te primeiro.");setBusy(false);return;}
      if(u.provider==="google"){setErr(lang==="en"?"This account uses Google. Log in with Google.":"Esta conta usa Google. Entra com Google.");setBusy(false);return;}
      if(u.pw!==hashPw(pw)){setErr(lang==="en"?"Incorrect password.":"Password incorreta.");setBusy(false);return;}
      const sess={email,name:u.name,provider:"email"};
      await saveSession(sess); onAuth(sess);
    }
    setBusy(false);
  };

  const googleAuth=async()=>{
    setBusy(true); setErr("");
    // DEMO: simula login Google. Em produção, integrar Google OAuth real.
    const demoEmail="utilizador.google@gmail.com";
    const users=await loadUsers();
    if(!users[demoEmail]) users[demoEmail]={email:demoEmail,name:lang==="en"?"Google User":"Utilizador Google",provider:"google"};
    await saveUsers(users);
    const sess={email:demoEmail,name:lang==="en"?"Google User":"Utilizador Google",provider:"google"};
    await saveSession(sess); onAuth(sess);
    setBusy(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:"26px 28px",maxWidth:380,width:"100%",boxShadow:"0 12px 40px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:18}}><Logo height={32} dark/></div>
        <div style={{display:"flex",background:GRAY,borderRadius:10,padding:3,marginBottom:18}}>
          {[["login",t("login")],["register",t("register")]].map(([k,l])=>(
            <button key={k} onClick={()=>{setTab(k);setErr("");}} style={{flex:1,padding:"8px 0",border:"none",borderRadius:8,background:tab===k?"#fff":"transparent",color:tab===k?ORANGE:"#888",fontWeight:tab===k?700:400,fontSize:13,cursor:"pointer",boxShadow:tab===k?"0 1px 3px rgba(0,0,0,0.1)":"none"}}>{l}</button>
          ))}
        </div>

        <button onClick={googleAuth} disabled={busy} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"10px 0",border:"1px solid #ddd",borderRadius:10,background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:14}}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C42.6 35.3 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
          {lang==="en"?"Continue with Google":"Continuar com Google"}
        </button>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{flex:1,height:1,background:"#eee"}}/>
          <span style={{fontSize:11,color:"#aaa"}}>{lang==="en"?"or with email":"ou com email"}</span>
          <div style={{flex:1,height:1,background:"#eee"}}/>
        </div>

        {tab==="register"&&(
          <div style={{marginBottom:10}}><Label>{lang==="en"?"Name":"Nome"}</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder={lang==="en"?"Your name":"O teu nome"}/></div>
        )}
        <div style={{marginBottom:10}}><Label>Email</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@exemplo.com"/></div>
        <div style={{marginBottom:14}}><Label>Password</Label><Input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••"/></div>

        {err&&<p style={{color:"#c0392b",fontSize:12,marginBottom:10}}>{err}</p>}
        <button onClick={submit} disabled={busy} style={{width:"100%",background:ORANGE,color:"#fff",border:"none",borderRadius:10,padding:"11px 0",fontSize:14,fontWeight:700,cursor:busy?"wait":"pointer"}}>
          {busy?(lang==="en"?"Processing…":"A processar…"):tab==="register"?(lang==="en"?"Create account":"Criar conta"):t("login")}
        </button>
        <p style={{fontSize:10,color:"#bbb",textAlign:"center",marginTop:12,lineHeight:1.4}}>{lang==="en"?"⚠️ Demo: accounts are stored locally in this browser. For production, integrate secure authentication (Firebase, Supabase or Auth0).":"⚠️ Demonstração: as contas são guardadas localmente neste browser. Para produção, integrar autenticação segura (Firebase, Supabase ou Auth0)."}</p>
      </div>
    </div>
  );
}

/* ── SMALL UI HELPERS ─────────────────────────────────────────────────────── */
const Label = ({children}) => <label style={{fontSize:11,color:"#555",display:"block",marginBottom:3}}>{children}</label>;
const Input = ({style,...p}) => <input style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #ddd",fontSize:13,boxSizing:"border-box",...style}} {...p}/>;
const Textarea = ({style,...p}) => <textarea style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #ddd",fontSize:12,boxSizing:"border-box",resize:"vertical",...style}} {...p}/>;
const Sel = ({style,...p}) => <select style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #ddd",fontSize:13,...style}} {...p}/>;

function Section({icon,title,color="#555",children}) {
  return (
    <div style={{border:`1.5px solid ${color}`,borderRadius:12,marginBottom:14,overflow:"hidden"}}>
      <div style={{background:color,padding:"7px 14px",display:"flex",alignItems:"center",gap:8}}>
        <span>{icon}</span><span style={{color:"#fff",fontWeight:700,fontSize:13}}>{title}</span>
      </div>
      <div style={{padding:"12px 14px",background:"#fff"}}>{children}</div>
    </div>
  );
}

function Spinner({t}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"48px 0"}}>
      <div style={{width:42,height:42,border:"4px solid #eee",borderTop:`4px solid ${ORANGE}`,borderRadius:"50%",animation:"spin .85s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{color:"#666",fontSize:13,textAlign:"center",maxWidth:280}}>{t?t("aVerificarGerar"):"A pesquisar em fontes científicas e a gerar plano personalizado…"}</p>
    </div>
  );
}

/* ── PAINEL: BANCO DE EXERCÍCIOS ─────────────────────────────────────────── */
function ExerciseLibraryPanel({library,onImport,onClear,t,lang}) {
  const [csvText,setCsvText]=useState("");
  const [status,setStatus]=useState(null); // {type:"ok"|"error", msg}
  const [busy,setBusy]=useState(false);
  const [testing,setTesting]=useState(false);
  const [testResults,setTestResults]=useState(null); // {ok:[], broken:[]}
  const fileRef=useRef();

  const testAllImages=async()=>{
    setTesting(true);
    setTestResults(null);
    const entries=library.filter(e=>e.imagem);
    const okOptimized=[]; const okRawOnly=[]; const broken=[];
    const loadTest=(url)=>new Promise(resolve=>{
      if(!isValidUrl(url)){ resolve(false); return; }
      const img=new Image();
      const timeout=setTimeout(()=>resolve(false),8000);
      img.onload=()=>{ clearTimeout(timeout); resolve(true); };
      img.onerror=()=>{ clearTimeout(timeout); resolve(false); };
      img.src=url;
    });
    const batchSize=6;
    for(let i=0;i<entries.length;i+=batchSize){
      const batch=entries.slice(i,i+batchSize);
      await Promise.all(batch.map(async(entry)=>{
        const optimizedOk=await loadTest(cloudinaryOptimize(entry.imagem,"f_auto,q_auto,w_80"));
        if(optimizedOk){ okOptimized.push(entry); return; }
        const rawOk=await loadTest(entry.imagem);
        if(rawOk){ okRawOnly.push(entry); return; }
        broken.push({...entry,reason:isValidUrl(entry.imagem)?"não carregou (404 ou bloqueado) — nem o link original nem o otimizado funcionaram":"URL estruturalmente inválido"});
      }));
    }
    setTestResults({okOptimized,okRawOnly,broken});
    setTesting(false);
  };

  const doImport=(text)=>{
    setBusy(true);
    try{
      const parsed=parseExerciseCsv(text);
      if(parsed.length===0){
        setStatus({type:"error",msg:"Não encontrei exercícios válidos. Confirma que a primeira linha tem os nomes das colunas e que a coluna 'Nome canónico do exercício' está preenchida."});
        setBusy(false);
        return;
      }
      onImport(parsed);
      setStatus({type:"ok",msg:`✓ ${parsed.length} exercício(s) importado(s) com sucesso.`});
      setCsvText("");
    }catch(e){
      setStatus({type:"error",msg:"Erro ao ler o ficheiro. Confirma que é um CSV válido."});
    }
    setBusy(false);
  };

  const handleFile=(e)=>{
    const f=e.target.files[0]; if(!f) return;
    const reader=new FileReader();
    reader.onload=ev=>doImport(ev.target.result);
    reader.readAsText(f,"utf-8");
    fileRef.current.value="";
  };

  const withImage=library.filter(e=>isValidUrl(e.imagem)).length;
  const withVideo=library.filter(e=>isValidUrl(e.video)).length;

  return (
    <div>
      <p style={{fontSize:13,color:"#666",marginBottom:10}}>
        Importa o teu banco de exercícios (CSV com imagens/vídeos do Cloudinary). Quando um plano gerar um exercício com <b>nome exatamente igual</b> ao nome canónico ou a um sinónimo da tua biblioteca, a imagem é associada automaticamente — sem correspondências aproximadas, para nunca mostrar a imagem errada.
      </p>

      {library.length>0 && (
        <div style={{background:"#f1f8f4",border:"1px solid #c8e6d4",borderRadius:8,padding:"9px 13px",marginBottom:14,fontSize:12,color:"#2e7d32"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <span><b>📚 Biblioteca ativa:</b> {library.length} exercícios · {withImage} com imagem · {withVideo} com vídeo</span>
            <div style={{display:"flex",gap:6}}>
              <button onClick={testAllImages} disabled={testing} style={{background:"#1a73e8",color:"#fff",border:"none",borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:testing?"wait":"pointer"}}>
                {testing?"⏳ A testar…":"🔍 Testar imagens"}
              </button>
              <button onClick={()=>{if(window.confirm("Limpar toda a biblioteca de exercícios?"))onClear();}} style={{background:"none",border:"1px solid #c0392b",color:"#c0392b",borderRadius:5,padding:"4px 9px",fontSize:11,cursor:"pointer"}}>Limpar</button>
            </div>
          </div>
        </div>
      )}

      {testResults&&(()=>{
        const total=testResults.okOptimized.length+testResults.okRawOnly.length+testResults.broken.length;
        return (
        <div style={{background:testResults.broken.length>0?"#fdf5f5":"#e8f5e9",border:`1px solid ${testResults.broken.length>0?"#f0b0b0":"#a5d6a7"}`,borderRadius:8,padding:"10px 13px",marginBottom:14,fontSize:12}}>
          <div style={{fontWeight:700,marginBottom:6,color:testResults.broken.length>0?"#c0392b":"#2e7d32"}}>
            Resultado: {testResults.okOptimized.length} otimizada(s) OK · {testResults.okRawOnly.length} só original OK · {testResults.broken.length} falharam (de {total})
          </div>

          {testResults.okRawOnly.length>0&&testResults.okOptimized.length===0&&(
            <div style={{background:"#fff8e1",border:"1px solid #f5d76e",borderRadius:6,padding:"8px 10px",marginBottom:8,color:"#8a6d00"}}>
              ⚠ <b>Diagnóstico:</b> os links originais funcionam, mas a versão otimizada (com transformação automática) falha em todos. Isto é um sinal clássico de <b>"Strict Transformations"</b> ativo na tua conta Cloudinary — uma proteção que bloqueia transformações de imagem feitas na hora. Vai a Settings → Security no Cloudinary e desativa "Strict Transformations". Entretanto, a app já usa o link original como reserva automática, por isso as imagens continuam a aparecer (só um pouco maiores/mais lentas).
            </div>
          )}

          {testResults.broken.length>0&&testResults.okRawOnly.length===0&&testResults.okOptimized.length===0&&(
            <div style={{background:"#fff8e1",border:"1px solid #f5d76e",borderRadius:6,padding:"8px 10px",marginBottom:8,color:"#8a6d00"}}>
              ⚠ <b>Diagnóstico:</b> nem os links originais carregam. Isto sugere que a pasta/imagens no Cloudinary podem estar como <b>privadas</b> em vez de públicas, ou os links foram copiados incorretamente. Confirma no Cloudinary que o "Delivery type" das imagens é "Upload" (público) e não "Private" ou "Authenticated".
            </div>
          )}

          {testResults.broken.length>0&&(
            <div style={{maxHeight:200,overflowY:"auto"}}>
              {testResults.broken.map((b,i)=>(
                <div key={i} style={{padding:"4px 8px",background:"#fff",borderRadius:5,marginBottom:4,fontSize:11}}>
                  <b>{b.nome}</b> — <span style={{color:"#c0392b"}}>{b.reason}</span>
                  <div style={{color:"#999",fontSize:10,wordBreak:"break-all",marginTop:2}}>{b.imagem}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        );
      })()}

      <div style={{marginBottom:8}}>
        <Label>Colar conteúdo do CSV (cabeçalho + linhas)</Label>
        <Textarea value={csvText} onChange={e=>setCsvText(e.target.value)} rows={7}
          placeholder={"Nome canónico do exercício,Sinónimos / variações,Categoria / zona corporal,Link da imagem,Link do vídeo,Instrução curta padronizada,Tipo de exercício,Patologias associadas comuns,Fonte clínica principal\nMonster walk,\"Caminhada monstro, Diagonal band walk\",Anca / Joelho,https://res.cloudinary.com/...,,Dá passos diagonais mantendo tensão...,Força / controlo,Dor femoropatelar,https://www.jospt.org/..."}
          style={{fontFamily:"monospace",fontSize:11}}/>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        <button onClick={()=>csvText.trim()&&doImport(csvText)} disabled={busy||!csvText.trim()} style={{background:ORANGE,color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:csvText.trim()?"pointer":"not-allowed",opacity:csvText.trim()?1:0.5}}>
          {busy?"A importar…":"📥 Importar do texto colado"}
        </button>
        <button onClick={()=>fileRef.current.click()} style={{background:DARK,color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          📁 Importar ficheiro .csv
        </button>
        <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={handleFile}/>
      </div>

      {status&&(
        <div style={{background:status.type==="ok"?"#e8f5e9":"#fdeeee",color:status.type==="ok"?"#2e7d32":"#c0392b",borderRadius:8,padding:"8px 12px",fontSize:12,marginBottom:12}}>{status.msg}</div>
      )}

      {library.length>0&&(
        <div style={{maxHeight:320,overflowY:"auto",border:"1px solid #eee",borderRadius:8}}>
          {library.map((ex,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 11px",borderBottom:i<library.length-1?"1px solid #f0f0f0":"none"}}>
              {isValidUrl(ex.imagem)
                ? <SmartImage src={cloudinaryOptimize(ex.imagem,"f_auto,q_auto,w_80,h_80,c_fill")} fallbackSrc={ex.imagem} alt="" size={36} rounded={6}/>
                : <div style={{width:36,height:36,borderRadius:6,background:GRAY,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#ccc"}}>—</div>
              }
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ex.nome}</div>
                <div style={{fontSize:10,color:"#999",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ex.categoria}{ex.sinonimos.length>0?` · ${ex.sinonimos.length} sinónimo(s)`:""}</div>
              </div>
              <div style={{display:"flex",gap:4,flexShrink:0}}>
                {isValidUrl(ex.imagem)&&<span style={{fontSize:10,background:"#e8f5e9",color:"#2e7d32",borderRadius:4,padding:"1px 5px"}}>📷</span>}
                {isValidUrl(ex.video)&&<span style={{fontSize:10,background:"#e8f5e9",color:"#2e7d32",borderRadius:4,padding:"1px 5px"}}>▶️</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      <ClinicalDisclaimer t={t}/>
    </div>
  );
}

/* ── GUIDELINES LIBRARY ───────────────────────────────────────────────────── */
function GuidelinesLibrary({guidelines,onAdd,onRemove,t}) {
  const ref = useRef(); const [tag,setTag]=useState(PATHOLOGIES[0]); const [name,setName]=useState("");
  const isEn = t && t("langLabel")==="Language";
  const go = e => { const f=e.target.files[0]; if(!f)return; onAdd({id:Date.now(),name:name||f.name,tag,fileName:f.name}); setName(""); ref.current.value=""; };
  return (
    <div>
      <p style={{fontSize:13,color:"#666",marginBottom:12}}>{isEn?"Guidelines with maximum priority over the online search.":"Guidelines com prioridade máxima sobre a pesquisa online."}</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}>
        <div><Label>{isEn?"Condition":"Patologia"}</Label><Sel value={tag} onChange={e=>setTag(e.target.value)}>{PATHOLOGIES.map(p=><option key={p}>{p}</option>)}</Sel></div>
        <div><Label>{isEn?"Guideline name":"Nome"}</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder={isEn?"e.g. Low Back Pain Protocol 2024":"Ex: Protocolo Lombalgia 2024"}/></div>
      </div>
      <button onClick={()=>ref.current.click()} style={{background:DARK,color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,cursor:"pointer",marginBottom:12}}>{isEn?"+ Add PDF / Guideline":"+ Adicionar PDF / Guideline"}</button>
      <input ref={ref} type="file" accept=".pdf,.doc,.docx,.txt" style={{display:"none"}} onChange={go}/>
      {guidelines.length===0 && <p style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"12px 0"}}>{isEn?"No guidelines added yet.":"Nenhuma guideline adicionada ainda."}</p>}
      {guidelines.map(g=>(
        <div key={g.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 11px",background:GRAY,borderRadius:8,marginBottom:6,border:"1px solid #e8e8e8"}}>
          <span>📄</span>
          <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{g.name}</div><div style={{fontSize:11,color:"#888"}}>{g.tag} · {g.fileName}</div></div>
          <span style={{background:"#fff3e6",color:ORANGE,borderRadius:5,padding:"1px 7px",fontSize:11,fontWeight:600}}>{g.tag}</span>
          <button onClick={()=>onRemove(g.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#e44",fontSize:15}}>✕</button>
        </div>
      ))}
      <ClinicalDisclaimer t={t}/>
    </div>
  );
}

/* ── OBJETIVO STEP ────────────────────────────────────────────────────────── */
function ObjetivoStep({patientData,onConfirm,onBack,t,lang}) {
  const [sel,setSel]=useState([]);
  const toggle = k => setSel(p=>p.includes(k)?p.filter(x=>x!==k):p.length<2?[...p,k]:p);
  return (
    <div>
      <div style={{background:GRAY,borderRadius:10,padding:"11px 14px",marginBottom:14,borderLeft:`4px solid ${ORANGE}`}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{t("confirmacaoPerfil")}</div>
        <div style={{fontSize:12,color:"#555",display:"flex",flexWrap:"wrap",gap:6}}>
          <span><b>{t("patologiaLbl")}:</b> {pathoLabel(patientData.patologiaFinal,lang)}</span>·
          <span><b>{t("faseLbl")}:</b> {phaseLabel(patientData.fase,lang)}</span>·
          <span><b>{t("idadeLbl")}:</b> {patientData.idade}</span>·
          <span><b>{t("generoLbl")}:</b> {patientData.genero}</span>
        </div>
      </div>
      <div style={{fontWeight:600,fontSize:15,marginBottom:3}}>{t("objetivoTitulo")}</div>
      <p style={{fontSize:12,color:"#888",marginBottom:12}}>{t("objetivoSub")}</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:14}}>
        {OBJETIVOS.map(obj=>{
          const active=sel.includes(obj.key); const disabled=!active&&sel.length===2;
          return (
            <div key={obj.key} onClick={()=>!disabled&&toggle(obj.key)}
              style={{border:active?`2px solid ${ORANGE}`:"1.5px solid #ddd",borderRadius:10,padding:"10px 12px",cursor:disabled?"not-allowed":"pointer",background:active?"#fff8f0":disabled?"#fafafa":"#fff",opacity:disabled?.5:1,position:"relative",transition:"all .15s"}}>
              {active&&<span style={{position:"absolute",top:6,right:8,background:ORANGE,color:"#fff",borderRadius:"50%",width:17,height:17,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>{sel.indexOf(obj.key)+1}</span>}
              <div style={{fontSize:20,marginBottom:3}}>{obj.icon}</div>
              <div style={{fontWeight:700,fontSize:13,color:active?ORANGE:DARK}}>{objLabel(obj,lang)}</div>
              <div style={{fontSize:11,color:"#888",marginTop:1}}>{objDesc(obj,lang)}</div>
            </div>
          );
        })}
      </div>
      {sel.length>0&&<div style={{background:"#fff8f0",border:`1px solid ${ORANGE}`,borderRadius:8,padding:"7px 12px",marginBottom:12,fontSize:12,color:"#555"}}>
        <b style={{color:ORANGE}}>{t("selecionado")}{sel.length>1?"s":""}:</b>{" "}
        {sel.map(k=>objLabel(OBJETIVOS.find(o=>o.key===k),lang)).join(" + ")}
        {sel.length===1&&<span style={{color:"#bbb"}}> {t("podeAdicionarMais")}</span>}
      </div>}
      <div style={{display:"flex",gap:10}}>
        <button onClick={onBack} style={{flex:1,background:"none",border:`1px solid ${DARK}`,borderRadius:10,padding:"11px 0",fontSize:14,cursor:"pointer"}}>{t("voltar")}</button>
        <button onClick={()=>sel.length&&onConfirm(sel)} disabled={!sel.length} style={{flex:2,background:sel.length?ORANGE:"#ddd",color:sel.length?"#fff":"#aaa",border:"none",borderRadius:10,padding:"11px 0",fontSize:14,fontWeight:700,cursor:sel.length?"pointer":"not-allowed"}}>
          {sel.length?`${t("gerarPlano")} ${sel.map(k=>objLabel(OBJETIVOS.find(o=>o.key===k),lang)).join(" + ")}`:t("selecionaObjetivo")}
        </button>
      </div>
    </div>
  );
}

/* ── HISTÓRICO ────────────────────────────────────────────────────────────── */
function HistoryView({user,onOpenPlan,onRequireLogin,t,lang}) {
  const [history,setHistory]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!user){setLoading(false);return;}
    loadHistory(user.email).then(h=>{setHistory(h);setLoading(false);});
  },[user]);

  if(!user){
    return (
      <div style={{textAlign:"center",padding:"40px 20px"}}>
        <div style={{fontSize:40,marginBottom:12}}>🔒</div>
        <div style={{fontWeight:700,fontSize:16,marginBottom:8}}>{t("historicoTitulo")}</div>
        <p style={{fontSize:13,color:"#666",maxWidth:340,margin:"0 auto 16px"}}>{t("historicoSub")}</p>
        <button onClick={onRequireLogin} style={{background:ORANGE,color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>{t("entrarRegistar")}</button>
      </div>
    );
  }

  if(loading) return <Spinner t={t}/>;

  if(history.length===0){
    return (
      <div style={{textAlign:"center",padding:"40px 20px"}}>
        <div style={{fontSize:40,marginBottom:12}}>📋</div>
        <div style={{fontWeight:700,fontSize:16,marginBottom:8}}>{t("semPlanos")}</div>
        <p style={{fontSize:13,color:"#666",maxWidth:340,margin:"0 auto"}}>{t("semPlanosSub")}</p>
      </div>
    );
  }

  const del=async(id)=>{
    const updated=await deletePlanFromHistory(user.email,id);
    setHistory(updated);
  };

  return (
    <div>
      <p style={{fontSize:13,color:"#666",marginBottom:14}}>{history.length} {lang==="en"?"saved plan(s) in your account. Click to reopen.":"plano(s) guardado(s) na tua conta. Clica para reabrir."}</p>
      {history.map(p=>{
        const objLabels=(p.objetivos||[]).map(k=>objLabel(OBJETIVOS.find(o=>o.key===k),lang)).join(" + ");
        const d=new Date(p.created_at);
        const exCount=(p.result?.exercises||[]).length;
        return (
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,marginBottom:8}}>
            <div style={{width:40,height:40,borderRadius:8,background:DARK,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{color:ORANGE,fontWeight:900,fontSize:13}}>{(p.patient_data?.patologiaFinal||"?")[0].toUpperCase()}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{pathoLabel(p.patient_data?.patologiaFinal,lang)||"Plano"}</div>
              <div style={{fontSize:11,color:"#888",marginTop:1}}>
                {p.patient_data?.idade} · {p.patient_data?.genero} · {exCount} {lang==="en"?"exercises":"exercícios"}
              </div>
              <div style={{fontSize:11,color:ORANGE,marginTop:1}}>{objLabels}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:10,color:"#aaa",marginBottom:6}}>{d.toLocaleDateString(lang==="en"?"en-GB":"pt-PT")} {d.toLocaleTimeString(lang==="en"?"en-GB":"pt-PT",{hour:"2-digit",minute:"2-digit"})}</div>
              <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                <button onClick={()=>onOpenPlan(p)} style={{background:ORANGE,color:"#fff",border:"none",borderRadius:7,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{t("abrir")}</button>
                <button onClick={()=>del(p.id)} title={t("eliminar")} style={{background:"#fff",border:"1px solid #f5b7b1",color:"#c0392b",borderRadius:7,width:30,cursor:"pointer"}}>✕</button>
              </div>
            </div>
          </div>
        );
      })}
      <ClinicalDisclaimer t={t}/>
    </div>
  );
}

/* ── EDITABLE LIST (cuidados / flags) ─────────────────────────────────────── */
function EditableList({items,field,onUpdate,onAdd,onRemove,t}) {
  return (
    <div>
      {items.map((it,i)=>(
        <div key={i} style={{display:"flex",gap:5,marginBottom:5,alignItems:"flex-start"}}>
          <textarea value={it} onChange={e=>onUpdate(field,i,e.target.value)} rows={2} style={{flex:1,fontSize:11,padding:"5px 7px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box",resize:"vertical"}}/>
          <button onClick={()=>onRemove(field,i)} style={{border:"1px solid #f5b7b1",background:"#fff",color:"#c0392b",borderRadius:5,width:24,height:24,cursor:"pointer",fontSize:12,flexShrink:0}}>✕</button>
        </div>
      ))}
      <button onClick={()=>onAdd(field)} style={{background:"none",border:"1px dashed #bbb",color:"#888",borderRadius:6,padding:"5px 0",fontSize:11,cursor:"pointer",width:"100%",marginTop:2}}>{t?t("adicionar"):"+ Adicionar"}</button>
    </div>
  );
}

/* ── RESULT VIEW ──────────────────────────────────────────────────────────── */
function ResultView({result:initialResult,onBack,patientData,objetivos,guidelines,user,onRequireLogin,onSaved,t,lang}) {
  const [activeTab,setActiveTab]=useState("utente"); // utente | fisio | infografico
  const [result,setResult]=useState(initialResult);
  const [editing,setEditing]=useState(false);
  const [saveState,setSaveState]=useState("idle"); // idle | saving | saved
  const objLabels=objetivos.map(k=>objLabel(OBJETIVOS.find(o=>o.key===k),lang)).join(" + ");
  const allEx=result.exercises||[];
  const [copied,setCopied]=useState(false);
  const [pmidStates,setPmidStates]=useState({}); // { exerciseIndex: validationResult }
  const [validating,setValidating]=useState(false);

  // Validate all PMIDs once when the result mounts; remove fake references
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      setValidating(true);
      const states={};
      const exs=[...(initialResult.exercises||[])];
      for(let i=0;i<exs.length;i++){
        const ex=exs[i];
        if(!ex.articleLink){ states[i]={status:"nopmid"}; continue; }
        const pmid=extractPMID(ex.articleLink);
        const r=await validatePMID(pmid,ex.articleRef);
        if(cancelled) return;
        states[i]=r;
        // Política: remover referências que NÃO existem ou NÃO correspondem
        if(r.status==="notfound"||r.status==="mismatch"||r.status==="nopmid"){
          exs[i]={...ex,articleLink:"",articleRef:"",_refRemoved:true,_refReason:r.status};
        } else if(r.status==="verified"){
          // Substituir pela referência REAL confirmada do PubMed
          const realRef=`${r.firstAuthor||""}${r.year?", "+r.year:""}`.trim();
          exs[i]={...ex,articleRef:realRef||ex.articleRef,_refVerified:true,_refTitle:r.title};
        }
        // status "error" (rede bloqueada) → mantém como está, marcado não-verificável
        setPmidStates({...states});
        setResult(prev=>({...prev,exercises:exs}));
      }
      if(!cancelled) setValidating(false);
    })();
    return ()=>{cancelled=true;};
  },[]);

  // Edit helpers
  const updateEx=(idx,field,value)=>setResult(r=>{
    const ex=[...r.exercises]; ex[idx]={...ex[idx],[field]:value}; return {...r,exercises:ex};
  });
  const removeEx=idx=>setResult(r=>({...r,exercises:r.exercises.filter((_,i)=>i!==idx)}));
  const addEx=()=>setResult(r=>({...r,exercises:[...r.exercises,{name:"Novo exercício",description:"",sets:"3",reps:"10",intensity:"",rest:"60s",frequency:"3x/semana",objetivo:OBJETIVOS.find(o=>o.key===objetivos[0])?.label||"",rationale:"",guideline:"",articleRef:"",articleLink:""}]}));
  const moveEx=(idx,dir)=>setResult(r=>{
    const ex=[...r.exercises]; const j=idx+dir;
    if(j<0||j>=ex.length) return r;
    [ex[idx],ex[j]]=[ex[j],ex[idx]]; return {...r,exercises:ex};
  });
  const updateList=(field,idx,value)=>setResult(r=>{
    const arr=[...(r[field]||[])]; arr[idx]=value; return {...r,[field]:arr};
  });
  const addListItem=field=>setResult(r=>({...r,[field]:[...(r[field]||[]),""]}));
  const removeListItem=(field,idx)=>setResult(r=>({...r,[field]:(r[field]||[]).filter((_,i)=>i!==idx)}));

  const verifiedCount=Object.values(pmidStates).filter(s=>s?.status==="verified").length;
  const removedCount=Object.values(pmidStates).filter(s=>s&&(s.status==="notfound"||s.status==="mismatch")).length;
  const unverifiableCount=Object.values(pmidStates).filter(s=>s&&s.status==="error").length;

  const infograficoPrompt=buildInfographicPrompt(result,patientData,objLabels,lang);

  const handlePDF=()=>{
    const html=buildPDF(result,patientData,objLabels,lang);
    // Try opening a new tab first (best for print-to-PDF)
    let opened=null;
    try { opened=window.open("","_blank"); } catch(e){ opened=null; }
    if(opened&&opened.document){
      opened.document.open();
      opened.document.write(html);
      opened.document.close();
      return;
    }
    // Fallback: trigger a download of the HTML file
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`Plano_PhysioPlanner_${(patientData.patologiaFinal||"plano").replace(/[^a-zA-Z0-9]/g,"_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  };

  const promptRef=useRef(null);

  const handleCopyPrompt=async()=>{
    let ok=false;
    try{
      await navigator.clipboard.writeText(infograficoPrompt);
      ok=true;
    }catch(e){
      // Fallback: select the textarea and use execCommand
      try{
        if(promptRef.current){
          promptRef.current.focus();
          promptRef.current.select();
          ok=document.execCommand("copy");
        }
      }catch(e2){ ok=false; }
    }
    if(ok){ setCopied(true); setTimeout(()=>setCopied(false),2500); }
    else { alert("Não consegui copiar automaticamente. Seleciona o texto na caixa e copia manualmente (Ctrl+C / Cmd+C)."); }
  };

  const openInAI=async(which)=>{
    // Copia o prompt para a área de transferência (o utilizador cola na sua conta)
    try{ await navigator.clipboard.writeText(infograficoPrompt); }
    catch(e){
      try{ promptRef.current?.focus(); promptRef.current?.select(); document.execCommand("copy"); }catch(e2){}
    }
    setCopied(true); setTimeout(()=>setCopied(false),2500);
    const urls={
      chatgpt:"https://chat.openai.com/",
      gemini:"https://gemini.google.com/app",
    };
    window.open(urls[which],"_blank");
  };

  const tabs=[["utente",t("tabUtente")],["fisio",t("tabFisio")],["infografico",t("tabInfografico")]]; // (mantido por compatibilidade, não usado diretamente abaixo)

  const handleSave=async()=>{
    if(!user){ onRequireLogin&&onRequireLogin(); return; }
    setSaveState("saving");
    await addPlanToHistory(user.email,{patientData,objetivos,result});
    setSaveState("saved");
    onSaved&&onSaved();
    setTimeout(()=>setSaveState("idle"),2500);
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <button onClick={onBack} style={{background:"none",border:`1px solid ${DARK}`,borderRadius:8,padding:"6px 13px",cursor:"pointer",fontSize:13}}>{t("novoplano")}</button>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={handleSave} disabled={saveState==="saving"} style={{background:saveState==="saved"?"#27ae60":"#fff",color:saveState==="saved"?"#fff":DARK,border:`1px solid ${saveState==="saved"?"#27ae60":DARK}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>
            {saveState==="saved"?t("guardado"):saveState==="saving"?t("aguardar"):user?t("guardar"):t("guardarEntrar")}
          </button>
          <button onClick={()=>setEditing(e=>!e)} style={{background:editing?"#27ae60":"#fff",color:editing?"#fff":DARK,border:`1px solid ${editing?"#27ae60":DARK}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>
            {editing?t("concluirEdicao"):t("editar")}
          </button>
          <button onClick={handlePDF} style={{background:ORANGE,color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>{t("pdf")}</button>
        </div>
      </div>

      {/* header card */}
      <div style={{background:DARK,borderRadius:12,padding:"13px 18px",marginBottom:12,display:"flex",alignItems:"center",gap:14}}>
        <Logo height={38}/>
        <div style={{flex:1,marginLeft:4}}>
          <div style={{color:"#fff",fontWeight:700,fontSize:14}}>{patientData.patologiaFinal}</div>
          <div style={{fontSize:11,color:"#aaa",marginTop:1}}>{patientData.idade} anos · {patientData.genero} · {PHASE_LABELS[patientData.fase]}</div>
          <div style={{fontSize:11,color:ORANGE,marginTop:1}}>Objetivos: {objLabels}</div>
        </div>
      </div>

      {/* sources */}
      <div style={{background:GRAY,borderRadius:8,padding:"6px 12px",marginBottom:8,fontSize:11,color:"#555",display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
        <b>{t("fontes")}</b>
        {(result.sources||[]).map((s,i)=><span key={i}>{s.url?<a href={s.url} target="_blank" rel="noreferrer" style={{color:ORANGE}}>{s.name}</a>:s.name}</span>)}
        {result.usedOwnGuidelines&&<span style={{background:"#fff3e6",color:ORANGE,borderRadius:4,padding:"1px 6px",fontWeight:700}}>+ {lang==="en"?"Custom guidelines":"Guidelines próprias"}</span>}
      </div>

      {/* validation summary */}
      <div style={{background:removedCount>0?"#fff8e1":"#f1f8f4",border:`1px solid ${removedCount>0?"#f5d76e":"#c8e6d4"}`,borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontWeight:700,color:DARK}}>{t("validacaoRefs")}</span>
          {validating
            ? <span style={{color:"#888"}}>{lang==="en"?`⏳ Checking each reference against the official NCBI database… (${Object.keys(pmidStates).length}/${allEx.length})`:`⏳ A verificar cada referência na base oficial do NCBI… (${Object.keys(pmidStates).length}/${allEx.length})`}</span>
            : <>
                <span style={{color:"#2e7d32"}}>✓ {verifiedCount} {lang==="en"?"confirmed":"confirmada(s)"}</span>
                {removedCount>0&&<span style={{color:"#c62828"}}>· 🗑 {removedCount} {lang==="en"?"invalid — removed":"inválida(s) removida(s)"}</span>}
                {unverifiableCount>0&&<span style={{color:"#f57f17"}}>· ⚠ {unverifiableCount} {lang==="en"?"not verifiable":"não verificável(eis)"}</span>}
              </>
          }
        </div>
        {!validating&&removedCount>0&&(
          <div style={{marginTop:5,color:"#996600",fontSize:10,lineHeight:1.5}}>
            {lang==="en"
              ? "References that do not exist or do not match the real PubMed record were automatically removed to ensure reliability. Affected exercises are left without a source — add a verified reference manually if needed."
              : "As referências que não existem ou não correspondem ao registo real do PubMed foram removidas automaticamente para garantir fiabilidade. Os exercícios afetados ficam sem fonte — adiciona uma referência verificada manualmente se necessário."}
          </div>
        )}
        {!validating&&unverifiableCount>0&&(
          <div style={{marginTop:5,color:"#996600",fontSize:10,lineHeight:1.5}}>
            {lang==="en"
              ? "⚠ Some references could not be verified (no connection to the PubMed database in this environment). Confirm them manually before use. In production, verification is automatic."
              : "⚠ Algumas referências não puderam ser verificadas (sem ligação à base do PubMed neste ambiente). Confirma-as manualmente antes de usar. Em ambiente de produção a verificação é automática."}
          </div>
        )}
      </div>

      {/* sub-tabs */}
      <div style={{display:"flex",borderBottom:`2px solid #e0e0e0`,marginBottom:14}}>
        {[["utente",t("tabUtente")],["fisio",t("tabFisio")],["infografico",t("tabInfografico")]].map(([k,l])=>(
          <button key={k} onClick={()=>setActiveTab(k)} style={{padding:"7px 14px",border:"none",background:"none",color:activeTab===k?ORANGE:"#666",fontWeight:activeTab===k?700:400,fontSize:13,cursor:"pointer",borderBottom:activeTab===k?`2px solid ${ORANGE}`:"none",marginBottom:-2}}>{l}</button>
        ))}
      </div>

      {/* ── UTENTE TAB ── */}
      {activeTab==="utente"&&<>
        {editing&&(
          <div style={{background:"#e8f5e9",border:"1px solid #a5d6a7",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#2e7d32"}}>
            {t("modoEdicao")}
          </div>
        )}
        {!editing&&(()=>{const withImg=allEx.filter(e=>isValidUrl(e.imageLink)).length; return withImg>0 ? (
          <div style={{background:"#f1f8f4",border:"1px solid #c8e6d4",borderRadius:8,padding:"6px 12px",marginBottom:12,fontSize:11,color:"#2e7d32"}}>
            📚 {withImg}/{allEx.length} {lang==="en"?"exercise(s) with a verified exercise-bank image.":"exercício(s) com imagem do banco de exercícios verificado."}
          </div>
        ) : null;})()}
        <Section icon="🏋️" title={`${t("planoTreino")} — ${allEx.length}`} color={DARK}>
          {!editing && allEx.map((ex,i)=>(
            <div key={i} style={{marginBottom:11,paddingBottom:11,borderBottom:i<allEx.length-1?"1px solid #eee":"none",display:"flex",gap:12}}>
              {ex.imageLink&&(
                <div style={{position:"relative",flexShrink:0}}>
                  <SmartImage src={cloudinaryOptimize(ex.imageLink)} fallbackSrc={ex.imageLink} alt={ex.name} size={70}/>
                  {ex._libraryMatch&&<span title="Imagem do banco de exercícios verificado" style={{position:"absolute",bottom:-4,right:-4,background:"#27ae60",color:"#fff",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,border:"2px solid #fff"}}>✓</span>}
                </div>
              )}
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                  <span style={{background:ORANGE,color:"#fff",borderRadius:4,padding:"1px 7px",fontWeight:700,fontSize:11}}>{i+1}</span>
                  <strong style={{fontSize:13}}>{ex.name}</strong>
                  {ex.objetivo&&<span style={{fontSize:10,background:GRAY,borderRadius:4,padding:"1px 5px",color:"#666"}}>{ex.objetivo}</span>}
                </div>
                <div style={{fontSize:12,color:"#444",marginBottom:3}}>{ex.description}</div>
                <div style={{fontSize:11,color:"#666",display:"flex",gap:6,flexWrap:"wrap"}}>
                  {ex.sets&&<span style={{background:GRAY,borderRadius:4,padding:"2px 6px"}}>📋 {ex.sets} séries</span>}
                  {ex.reps&&<span style={{background:GRAY,borderRadius:4,padding:"2px 6px"}}>🔁 {ex.reps}</span>}
                  {ex.intensity&&<span style={{background:"#fff3e6",color:ORANGE,borderRadius:4,padding:"2px 6px"}}>⚡ {ex.intensity}</span>}
                  {ex.rest&&<span style={{background:GRAY,borderRadius:4,padding:"2px 6px"}}>⏱ {ex.rest}</span>}
                  {ex.frequency&&<span style={{background:GRAY,borderRadius:4,padding:"2px 6px"}}>🗓 {ex.frequency}</span>}
                </div>
                <div style={{marginTop:5}}>
                  {isValidUrl(ex.videoLink)
                    ? <a href={ex.videoLink} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#c0392b",textDecoration:"none",fontWeight:600}}>{t("verDemo")}</a>
                    : <a href={youtubeSearchUrl(ex.name,patientData.patologiaFinal)} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#888",textDecoration:"none"}}>{t("procurarYoutube")}</a>
                  }
                </div>
              </div>
            </div>
          ))}

          {editing && allEx.map((ex,i)=>(
            <div key={i} style={{border:"1px solid #ddd",borderRadius:10,padding:"10px 12px",marginBottom:10,background:"#fafafa"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <span style={{background:ORANGE,color:"#fff",borderRadius:4,padding:"1px 7px",fontWeight:700,fontSize:11}}>{i+1}</span>
                <input value={ex.name} onChange={e=>updateEx(i,"name",e.target.value)} style={{flex:1,fontWeight:700,fontSize:13,padding:"5px 8px",border:"1px solid #ddd",borderRadius:6}}/>
                <div style={{display:"flex",gap:3}}>
                  <button onClick={()=>moveEx(i,-1)} disabled={i===0} title="Subir" style={{border:"1px solid #ddd",background:"#fff",borderRadius:5,width:26,height:26,cursor:i===0?"not-allowed":"pointer",opacity:i===0?0.4:1}}>↑</button>
                  <button onClick={()=>moveEx(i,1)} disabled={i===allEx.length-1} title="Descer" style={{border:"1px solid #ddd",background:"#fff",borderRadius:5,width:26,height:26,cursor:i===allEx.length-1?"not-allowed":"pointer",opacity:i===allEx.length-1?0.4:1}}>↓</button>
                  <button onClick={()=>removeEx(i)} title="Remover" style={{border:"1px solid #f5b7b1",background:"#fff",color:"#c0392b",borderRadius:5,width:26,height:26,cursor:"pointer"}}>✕</button>
                </div>
              </div>
              <textarea value={ex.description} onChange={e=>updateEx(i,"description",e.target.value)} placeholder="Descrição do exercício" rows={2} style={{width:"100%",fontSize:12,padding:"6px 8px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box",resize:"vertical",marginBottom:8}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:6}}>
                <div><div style={{fontSize:10,color:"#888",marginBottom:2}}>Séries</div><input value={ex.sets||""} onChange={e=>updateEx(i,"sets",e.target.value)} style={{width:"100%",fontSize:12,padding:"5px 7px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}}/></div>
                <div><div style={{fontSize:10,color:"#888",marginBottom:2}}>Repetições</div><input value={ex.reps||""} onChange={e=>updateEx(i,"reps",e.target.value)} style={{width:"100%",fontSize:12,padding:"5px 7px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}}/></div>
                <div><div style={{fontSize:10,color:"#888",marginBottom:2}}>Intensidade</div><input value={ex.intensity||""} onChange={e=>updateEx(i,"intensity",e.target.value)} style={{width:"100%",fontSize:12,padding:"5px 7px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                <div><div style={{fontSize:10,color:"#888",marginBottom:2}}>Descanso</div><input value={ex.rest||""} onChange={e=>updateEx(i,"rest",e.target.value)} style={{width:"100%",fontSize:12,padding:"5px 7px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}}/></div>
                <div><div style={{fontSize:10,color:"#888",marginBottom:2}}>Frequência</div><input value={ex.frequency||""} onChange={e=>updateEx(i,"frequency",e.target.value)} style={{width:"100%",fontSize:12,padding:"5px 7px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}}/></div>
                <div><div style={{fontSize:10,color:"#888",marginBottom:2}}>Objetivo</div><select value={ex.objetivo||""} onChange={e=>updateEx(i,"objetivo",e.target.value)} style={{width:"100%",fontSize:12,padding:"5px 7px",border:"1px solid #ddd",borderRadius:6}}>{objetivos.map(k=>{const o=OBJETIVOS.find(x=>x.key===k);return <option key={k}>{o?.label}</option>;})}</select></div>
              </div>
              <div style={{marginTop:8}}>
                <div style={{fontSize:10,color:"#888",marginBottom:2,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>Link de demonstração (vídeo ou imagem)</span>
                  <a href={youtubeSearchUrl(ex.name,patientData.patologiaFinal)} target="_blank" rel="noreferrer" style={{color:"#c0392b",fontSize:10,textDecoration:"none",fontWeight:600}}>🔍 Procurar no YouTube →</a>
                </div>
                <input value={ex.videoLink||""} onChange={e=>updateEx(i,"videoLink",e.target.value)} placeholder="Cola aqui o link do vídeo (ex: https://youtu.be/...)" style={{width:"100%",fontSize:12,padding:"5px 7px",border:`1px solid ${ex.videoLink&&!isValidUrl(ex.videoLink)?"#f5b7b1":"#ddd"}`,borderRadius:6,boxSizing:"border-box"}}/>
                {ex.videoLink&&!isValidUrl(ex.videoLink)&&<div style={{fontSize:10,color:"#c0392b",marginTop:2}}>⚠ O link parece inválido. Deve começar por http:// ou https://</div>}
              </div>
              <div style={{marginTop:8}}>
                <div style={{fontSize:10,color:"#888",marginBottom:2,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:4}}>
                  <span>Imagem do exercício (URL)</span>
                  <span style={{display:"flex",gap:8}}>
                    <a href={googleImagesUrl(ex.name)} target="_blank" rel="noreferrer" style={{color:"#1a73e8",fontSize:10,textDecoration:"none",fontWeight:600}}>🖼️ Google Imagens →</a>
                    <button onClick={async()=>{const p=geminiImagePrompt(ex.name);try{await navigator.clipboard.writeText(p);}catch(e){}window.open("https://gemini.google.com/app","_blank");}} style={{background:"none",border:"none",color:"#E8670A",fontSize:10,fontWeight:600,cursor:"pointer",padding:0}}>✨ Gerar no Gemini →</button>
                  </span>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {isValidUrl(ex.imageLink)&&<img src={cloudinaryOptimize(ex.imageLink,"f_auto,q_auto,w_80,h_80,c_fill")} alt="" style={{width:40,height:40,objectFit:"cover",borderRadius:6,border:"1px solid #ddd"}} onError={e=>{e.target.style.display="none";}}/>}
                  <input value={ex.imageLink||""} onChange={e=>updateEx(i,"imageLink",e.target.value)} placeholder="Cola o URL da imagem (ex: https://.../imagem.jpg)" style={{flex:1,fontSize:12,padding:"5px 7px",border:`1px solid ${ex.imageLink&&!isValidUrl(ex.imageLink)?"#f5b7b1":"#ddd"}`,borderRadius:6,boxSizing:"border-box"}}/>
                  {ex._libraryMatch&&<span style={{fontSize:9,background:"#e8f5e9",color:"#2e7d32",borderRadius:4,padding:"2px 6px",whiteSpace:"nowrap"}}>✓ Banco</span>}
                </div>
                {ex.imageLink&&!isValidUrl(ex.imageLink)&&<div style={{fontSize:10,color:"#c0392b",marginTop:2}}>⚠ O link da imagem parece inválido.</div>}
              </div>
            </div>
          ))}

          {editing && (
            <button onClick={addEx} style={{width:"100%",background:"#fff",border:`1.5px dashed ${ORANGE}`,color:ORANGE,borderRadius:8,padding:"9px 0",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:4}}>{t("adicionarExercicio")}</button>
          )}
        </Section>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Section icon="⚠️" title={t("cuidados")} color="#555">
            {!editing
              ? <ul style={{margin:0,paddingLeft:15}}>{(result.cuidados||[]).map((c,i)=><li key={i} style={{fontSize:12,marginBottom:4,color:"#333"}}>{c}</li>)}</ul>
              : <EditableList items={result.cuidados||[]} field="cuidados" onUpdate={updateList} onAdd={addListItem} onRemove={removeListItem} t={t}/>
            }
          </Section>
          <div>
            <Section icon="🚩" title={t("redFlags")} color="#c0392b">
              {!editing
                ? <ul style={{margin:0,paddingLeft:15}}>{(result.redFlags||[]).map((f,i)=><li key={i} style={{fontSize:12,marginBottom:4,color:"#333"}}>{f}</li>)}</ul>
                : <EditableList items={result.redFlags||[]} field="redFlags" onUpdate={updateList} onAdd={addListItem} onRemove={removeListItem} t={t}/>
              }
            </Section>
            <Section icon="🟡" title={t("yellowFlags")} color="#e67e22">
              {!editing
                ? <ul style={{margin:0,paddingLeft:15}}>{(result.yellowFlags||[]).map((f,i)=><li key={i} style={{fontSize:12,marginBottom:4,color:"#333"}}>{f}</li>)}</ul>
                : <EditableList items={result.yellowFlags||[]} field="yellowFlags" onUpdate={updateList} onAdd={addListItem} onRemove={removeListItem} t={t}/>
              }
            </Section>
          </div>
        </div>
      </>}

      {/* ── FISIO TAB ── */}
      {activeTab==="fisio"&&<>
        <Section icon="📋" title={t("resumoClinico")} color={DARK}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>
            {[[t("patologiaLbl"),pathoLabel(patientData.patologiaFinal,lang)],[t("faseLbl"),phaseLabel(patientData.fase,lang)],[lang==="en"?"Age / Gender":"Idade / Género",`${patientData.idade} · ${patientData.genero}`],[t("profissao"),patientData.profissao||"—"],[lang==="en"?"Positive tests":"Testes positivos",patientData.testesEspeciais||"—"],[t("outrosFatores"),patientData.outrosFatores||"—"],[lang==="en"?"Problem (patient)":"Problema (utente)",patientData.problemaPaciente||"—"],[lang==="en"?"Assessment (PT)":"Avaliação (fisio)",patientData.problemaFisio||"—"],[lang==="en"?"History/goal":"Histórico/objetivo",patientData.fatorHistorico||"—"]].map(([k,v])=>(
              <div key={k} style={{background:GRAY,borderRadius:8,padding:"7px 10px"}}>
                <div style={{fontSize:10,color:"#888",marginBottom:2}}>{k}</div>
                <div style={{fontWeight:600,color:DARK}}>{v}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section icon="🔬" title={t("planoEstruturado")} color="#1a5276">
          {objetivos.map(objKey=>{
            const objData=OBJETIVOS.find(o=>o.key===objKey);
            const exs=allEx.filter(e=>e.objetivo===objData?.label);
            return (
              <div key={objKey} style={{marginBottom:18}}>
                <div style={{fontWeight:700,fontSize:13,color:"#1a5276",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                  <span>{objData?.icon}</span>{objLabel(objData,lang)}
                  <span style={{fontSize:10,background:"#eaf2ff",color:"#1a5276",borderRadius:4,padding:"1px 7px",fontWeight:400}}>{objPresc(objData,lang)}</span>
                </div>
                {exs.map((ex)=>{
                  const globalIdx=allEx.indexOf(ex);
                  return (
                  <div key={globalIdx} style={{background:GRAY,borderRadius:8,padding:"9px 12px",marginBottom:7}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>{ex.name}</div>
                        <div style={{fontSize:12,color:"#444",marginTop:2}}>{ex.description}</div>
                        <div style={{fontSize:11,color:"#666",marginTop:4,display:"flex",gap:6,flexWrap:"wrap"}}>
                          {ex.sets&&<span>📋 {ex.sets}</span>}
                          {ex.reps&&<span>🔁 {ex.reps}</span>}
                          {ex.intensity&&<span style={{color:ORANGE}}>⚡ {ex.intensity}</span>}
                          {ex.rest&&<span>⏱ {ex.rest}</span>}
                          {ex.frequency&&<span>🗓 {ex.frequency}</span>}
                        </div>
                      </div>
                    </div>
                    {ex.rationale&&<div style={{marginTop:6,padding:"5px 9px",background:"#eaf2ff",borderRadius:6,fontSize:11,color:"#1a5276"}}><b>{t("justificacaoClinica")}</b> {ex.rationale}</div>}
                    {ex.articleLink
                      ? <div style={{marginTop:5,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <a href={ex.articleLink} target="_blank" rel="noreferrer" style={{fontSize:11,color:ORANGE,textDecoration:"none"}}>📖 {ex.articleRef||(lang==="en"?"View article":"Ver artigo")}</a>
                          <PMIDBadge state={pmidStates[globalIdx]}/>
                        </div>
                      : ex._refRemoved
                        ? <div style={{marginTop:5,fontSize:11,color:"#c0392b",background:"#fdeeee",borderRadius:5,padding:"3px 8px",display:"inline-block"}}>{lang==="en"?"⚠ Reference removed (not confirmed on PubMed) — add a verified source":"⚠ Referência removida (não confirmada no PubMed) — adiciona uma fonte verificada"}</div>
                        : null
                    }
                    {ex.guideline&&<div style={{marginTop:3,fontSize:11,color:"#888"}}>📌 {t("guideline")} {ex.guideline}</div>}
                  </div>
                  );
                })}
              </div>
            );
          })}
          {result.guidelinesUsed&&(
            <div style={{marginTop:8,padding:"8px 12px",background:"#fff3e6",borderRadius:8,fontSize:12,color:"#855"}}>
              <b style={{color:ORANGE}}>{t("artigosGuidelines")}</b>
              <ul style={{margin:"5px 0 0",paddingLeft:16}}>
                {result.guidelinesUsed.map((g,i)=><li key={i} style={{marginBottom:3}}>{g.url?<a href={g.url} target="_blank" rel="noreferrer" style={{color:ORANGE}}>{g.ref}</a>:g.ref}</li>)}
              </ul>
            </div>
          )}
        </Section>
      </>}

      {/* ── INFOGRÁFICO TAB ── */}
      {activeTab==="infografico"&&(
        <div>
          <div style={{background:"#fff8f0",border:`1.5px solid ${ORANGE}`,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:14,color:ORANGE,marginBottom:6}}>{t("infograficoTitulo")}</div>
            <p style={{fontSize:13,color:"#555",marginBottom:10}}>{t("infograficoDesc")}</p>
            <textarea ref={promptRef} readOnly value={infograficoPrompt} onClick={e=>e.target.select()}
              style={{width:"100%",height:200,fontSize:11,color:"#333",fontFamily:"monospace",lineHeight:1.5,padding:"12px",border:"1px solid #e0c8a0",borderRadius:8,marginBottom:10,boxSizing:"border-box",resize:"vertical",background:"#fff"}}/>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={handleCopyPrompt} style={{flex:"1 1 100%",background:copied?"#27ae60":ORANGE,color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",transition:"background .3s"}}>
                {copied?t("promptCopiado"):t("copiarPrompt")}
              </button>
              <button onClick={()=>openInAI("chatgpt")} style={{flex:1,background:DARK,color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",minWidth:140}}>
                {t("abrirChatGPT")}
              </button>
              <button onClick={()=>openInAI("gemini")} style={{flex:1,background:"#1a73e8",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",minWidth:140}}>
                {t("abrirGemini")}
              </button>
            </div>
            <p style={{fontSize:10,color:"#aaa",textAlign:"center",marginTop:8}}>{lang==="en"?"The prompt is copied automatically — when the AI opens, just paste (Ctrl+V / Cmd+V) and send.":"O prompt é copiado automaticamente — ao abrir a IA, basta colar (Ctrl+V / Cmd+V) e enviar."}</p>
          </div>
          <div style={{background:GRAY,borderRadius:8,padding:"10px 14px",fontSize:12,color:"#666"}}>
            <b>{t("comoUsar")}</b>
            <ol style={{margin:"5px 0 0",paddingLeft:16}}>
              {lang==="en" ? (<>
                <li style={{marginBottom:3}}>Click "Copy + open ChatGPT" or "Gemini" (the prompt is copied)</li>
                <li style={{marginBottom:3}}>In the tab that opens, paste the prompt (Ctrl+V) and send</li>
                <li>Download the generated infographic and hand it to the patient</li>
              </>) : (<>
                <li style={{marginBottom:3}}>Clica em "Copiar + abrir ChatGPT" ou "Gemini" (o prompt fica copiado)</li>
                <li style={{marginBottom:3}}>Na aba que abrir, cola o prompt (Ctrl+V) e envia</li>
                <li>Descarrega o infográfico gerado e entrega ao utente</li>
              </>)}
            </ol>
          </div>
          <ClinicalDisclaimer t={t}/>
        </div>
      )}

      <ClinicalDisclaimer t={t}/>
    </div>
  );
}

/* ── INFOGRAPHIC PROMPT BUILDER ───────────────────────────────────────────── */
function buildInfographicPrompt(result,pd,objLabels,lang="pt") {
  const exList=(result.exercises||[]).map((ex,i)=>{
    const video = ex.videoLink&&/^https?:\/\//.test(ex.videoLink) ? ` [${lang==="en"?"demo":"demonstração"}: ${ex.videoLink}]` : "";
    return `${i+1}. ${ex.name}: ${ex.description} — ${[ex.sets&&`${ex.sets} ${lang==="en"?"sets":"séries"}`,ex.reps,ex.intensity,ex.rest&&`${lang==="en"?"rest":"descanso"} ${ex.rest}`].filter(Boolean).join(", ")}${video}`;
  }).join("\n");
  const redFlagsShort=(result.redFlags||[]).slice(0,3).join("; ");
  const yellowFlagsList=(result.yellowFlags||[]).map(f=>`• ${f}`).join("\n");

  if(lang==="en"){
    const person = pd.genero==="Feminino"||pd.genero==="Female" ? "an active adult woman" : "an active adult man";
    return `Create a professional, clinical and visually appealing infographic, in English, with the title:
"Exercise Plan"

━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUAL IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━
• "Physio Planner" logo in the top-left corner — a minimalist owl icon in dark navy line-art with an orange medical cross at its center, next to the name "Physio Planner" (elegant typography).
• Clinical, modern, clean and professional look.
• Palette: white, dark navy (#16202e), grey and orange accents (#E8670A).
• No simplified stick figures.
• Semi-realistic images of ${person} in neutral workout clothing, performing each exercise safely.
• Simple home/rehab exercise setting.
• Vertical clinical infographic layout, ready to hand to the patient.

━━━━━━━━━━━━━━━━━━━━━━━━━━
INTRODUCTION (below the title)
━━━━━━━━━━━━━━━━━━━━━━━━━━
"Plan oriented towards ${objLabels}, improving ${pd.problemaPaciente||"[patient-reported problem]"} and ${pd.problemaFisio||"[physiotherapist's assessment]"}."

━━━━━━━━━━━━━━━━━━━━━━━━━━
SAFETY NOTE (discreet box at the start)
━━━━━━━━━━━━━━━━━━━━━━━━━━
"Perform only with clinical clearance and without severe pain. Stop immediately if: ${redFlagsShort}."

━━━━━━━━━━━━━━━━━━━━━━━━━━
EXERCISES (${(result.exercises||[]).length} exercises — 1 semi-realistic image per exercise)
━━━━━━━━━━━━━━━━━━━━━━━━━━
${exList}

━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT PRECAUTIONS (box at the bottom)
━━━━━━━━━━━━━━━━━━━━━━━━━━
Include the following precautions (yellow flags) defined for this patient:
${yellowFlagsList||"• Progress only according to tolerance and the physiotherapist's guidance."}

━━━━━━━━━━━━━━━━━━━━━━━━━━
FOOTER
━━━━━━━━━━━━━━━━━━━━━━━━━━
"Plan adapted to the individual clinical condition. Progression should always be supervised by a healthcare professional."`;
  }

  const senhor = pd.genero==="Feminino" ? "uma senhora adulta ativa" : "um senhor adulto ativo";

  return `Cria um infográfico profissional, clínico e visualmente apelativo, em português de Portugal, com o título:
"Plano de Treino"

━━━━━━━━━━━━━━━━━━━━━━━━━━
IDENTIDADE VISUAL
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Logótipo "Physio Planner" no canto superior esquerdo — uma coruja minimalista em traço azul-escuro com uma cruz médica laranja ao centro, ao lado do nome "Physio Planner" (texto elegante).
• Aspeto clínico, moderno, limpo e profissional.
• Paleta: branco, azul-escuro (#16202e), cinzento e apontamentos em laranja (#E8670A).
• Sem bonecos simplificados nem stick figures.
• Imagens semi-realistas de ${senhor} em roupa de treino neutra, a realizar cada exercício de forma segura.
• Ambiente simples de reabilitação ou exercício domiciliário.
• Layout vertical tipo infográfico clínico, pronto para entregar ao utente.

━━━━━━━━━━━━━━━━━━━━━━━━━━
INTRODUÇÃO (abaixo do título)
━━━━━━━━━━━━━━━━━━━━━━━━━━
"Plano orientado para ${objLabels}, melhoria de ${pd.problemaPaciente||"[problema do utente]"} e ${pd.problemaFisio||"[avaliação do fisioterapeuta]"}."

━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTA DE SEGURANÇA (caixa discreta no início)
━━━━━━━━━━━━━━━━━━━━━━━━━━
"Realizar apenas com autorização clínica e sem dor intensa. Parar imediatamente se: ${redFlagsShort}."

━━━━━━━━━━━━━━━━━━━━━━━━━━
EXERCÍCIOS (${(result.exercises||[]).length} exercícios — 1 imagem semi-realista por exercício)
━━━━━━━━━━━━━━━━━━━━━━━━━━
${exList}

━━━━━━━━━━━━━━━━━━━━━━━━━━
CUIDADOS IMPORTANTES (caixa no fundo)
━━━━━━━━━━━━━━━━━━━━━━━━━━
Inclui os seguintes pontos de atenção (yellow flags) definidos para este utente:
${yellowFlagsList||"• Progredir apenas de acordo com a tolerância e orientação do fisioterapeuta."}

━━━━━━━━━━━━━━━━━━━━━━━━━━
RODAPÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━
"Plano adaptado à condição clínica individual. A progressão deve ser sempre acompanhada por um profissional de saúde."`;
}

/* ── PDF BUILDER ──────────────────────────────────────────────────────────── */
function buildPDF(result,pd,objLabels,lang="pt") {
  const L = lang==="en" ? {
    title:"Physio Planner Plan",exercisePlan:"🏋️ Exercise Plan",exercises:"exercises",precautions:"⚠️ Precautions",
    redFlags:"🚩 Red Flags",yellowFlags:"🟡 Yellow Flags",sourcesConsulted:"Sources consulted:",customGuidelines:"+ Custom guidelines",
    reportedProblem:"Reported problem:",ptAssessment:"PT assessment:",articlesGuidelines:"📌 Articles and Guidelines",
    demo:"▶️ Watch exercise demonstration",searchDemo:"🔍 Search for a demonstration on YouTube",
    saveAsPdf:"🖨️ Save as PDF",clinicalNotice:"⚕️ Clinical notice:",
    clinicalNoticeText:"This plan is a decision-support aid and does not replace clinical judgement. The final decision rests with the healthcare professional. Scientific references should be confirmed before use. Progression should always be supervised by a healthcare professional.",
    footer:"Physio Planner clinical plan",basedOn:"Based on scientific evidence",
    goals:"Goals:",stage:"Stage",
  } : {
    title:"Plano Physio Planner",exercisePlan:"🏋️ Plano de Treino",exercises:"exercícios",precautions:"⚠️ Cuidados",
    redFlags:"🚩 Red Flags",yellowFlags:"🟡 Yellow Flags",sourcesConsulted:"Fontes consultadas:",customGuidelines:"+ Guidelines próprias",
    reportedProblem:"Problema referido:",ptAssessment:"Avaliação fisio:",articlesGuidelines:"📌 Artigos e Guidelines",
    demo:"▶️ Ver demonstração do exercício",searchDemo:"🔍 Procurar demonstração no YouTube",
    saveAsPdf:"🖨️ Guardar como PDF",clinicalNotice:"⚕️ Aviso clínico:",
    clinicalNoticeText:"Este plano é um apoio à decisão e não substitui o julgamento clínico. A decisão final é da responsabilidade do profissional de saúde. As referências científicas devem ser confirmadas antes de utilizadas. A progressão deve ser sempre acompanhada por um profissional de saúde.",
    footer:"Plano clínico Physio Planner",basedOn:"Baseado em evidência científica",
    goals:"Objetivos:",stage:"Fase",
  };
  const exRows=(result.exercises||[]).map((ex,i)=>{
    const videoHtml = ex.videoLink&&/^https?:\/\//.test(ex.videoLink)
      ? `<div style="margin-top:3px"><a href="${ex.videoLink}" style="font-size:10px;color:#c0392b;font-weight:600">${L.demo}</a></div>`
      : `<div style="margin-top:3px"><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name+" exercise physiotherapy")}" style="font-size:10px;color:#888">${L.searchDemo}</a></div>`;
    const imgHtml = ex.imageLink&&/^https?:\/\//.test(ex.imageLink)
      ? `<td style="padding:8px 6px;width:64px;vertical-align:top"><img src="${cloudinaryOptimize(ex.imageLink,"f_auto,q_auto,w_120,h_120,c_fill")}" onerror="this.onerror=null;this.src='${ex.imageLink}';" alt="" style="width:58px;height:58px;object-fit:cover;border-radius:6px;border:1px solid #eee"/></td>`
      : "";
    return `
    <tr style="background:${i%2===0?"#fff":"#f9f9f9"}">
      <td style="padding:8px 10px;font-weight:700;color:#E8670A;width:24px;text-align:center;vertical-align:top">${i+1}</td>
      ${imgHtml}
      <td style="padding:8px 10px">
        <div style="font-weight:700;font-size:13px">${ex.name}${ex.objetivo?` <span style="font-size:10px;background:#f0f0f0;border-radius:3px;padding:1px 5px;color:#666">${ex.objetivo}</span>`:""}</div>
        <div style="font-size:12px;color:#444;margin-top:2px">${ex.description||""}</div>
        <div style="font-size:11px;color:#777;margin-top:3px">${[ex.sets&&`${ex.sets} séries`,ex.reps,ex.intensity,ex.rest&&`Descanso: ${ex.rest}`,ex.frequency].filter(Boolean).join(" · ")}</div>
        ${videoHtml}
        ${ex.articleLink?`<div style="margin-top:2px"><a href="${ex.articleLink}" style="font-size:10px;color:#E8670A">${ex.articleRef||ex.articleLink}</a></div>`:""}
      </td>
    </tr>`;
  }).join("");

  const flag=(arr,color,title)=>(arr||[]).length?`<div style="margin-bottom:10px"><div style="font-weight:700;font-size:12px;color:${color};margin-bottom:4px">${title}</div><ul style="margin:0;padding-left:16px">${arr.map(f=>`<li style="font-size:11px;margin-bottom:2px">${f}</li>`).join("")}</ul></div>`:"";
  const srcH=(result.sources||[]).map(s=>s.url?`<a href="${s.url}" style="color:#E8670A">${s.name}</a>`:s.name).join(" · ");

  return `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8">
<title>Plano Physio Planner — ${pd.patologiaFinal}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#fff;color:#222;padding:28px 32px;font-size:13px}
.hdr{background:#16202e;color:#fff;border-radius:10px;padding:16px 20px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center}
.logo{font-family:Arial,sans-serif;font-weight:800;font-size:22px;letter-spacing:.3px}
.logo .light{font-weight:400}
.tagline{font-size:9px;opacity:.6;margin-top:1px}
.meta{text-align:right;font-size:11px;color:#aaa}
.meta span{color:#E8670A;font-weight:700}
.src{font-size:10px;color:#777;background:#f4f4f4;padding:5px 10px;border-radius:6px;margin-bottom:14px}
h2{font-size:13px;font-weight:700;padding:6px 12px;border-radius:6px;margin:14px 0 7px;color:#fff}
table{width:100%;border-collapse:collapse;margin-bottom:14px}
.flags{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px}
.flag-box{border-radius:7px;padding:9px 11px;border:1px solid #e0e0e0}
.footer{margin-top:18px;border-top:1px solid #eee;padding-top:10px;font-size:9px;color:#aaa;text-align:center}
.dl-bar{position:sticky;top:0;background:#fff;border-bottom:1px solid #eee;padding:10px 0;margin:-28px -32px 20px;padding-left:32px;padding-right:32px;display:flex;justify-content:flex-end;gap:8px;z-index:10}
.dl-btn{background:#E8670A;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:Arial,sans-serif}
.dl-btn.secondary{background:#16202e}
@media print{.dl-bar{display:none}body{padding:14px 18px}a{color:#E8670A!important}}
</style></head><body>
<div class="dl-bar">
  <button class="dl-btn secondary" onclick="window.print()">🖨️ Guardar como PDF</button>
</div>
<div class="hdr">
  <div class="brand" style="display:flex;align-items:center;gap:10px">
    <svg width="38" height="38" viewBox="0 0 100 100" fill="none">
      <path d="M30 30 Q28 18 38 20 L46 26 M70 30 Q72 18 62 20 L54 26" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M30 30 Q50 24 70 30" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <path d="M30 30 Q24 52 30 70 Q38 86 50 86 Q62 86 70 70 Q76 52 70 30" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M36 40 Q46 40 46 47 Q46 53 38 53 L38 62" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M64 40 Q54 40 54 47 Q54 53 62 53 L62 62" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M44 62 Q44 72 50 76 Q56 72 56 62" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M42 86 L40 92 M58 86 L60 92" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <rect x="46" y="46" width="8" height="20" rx="1.5" fill="#E8670A"/>
      <rect x="40" y="52" width="20" height="8" rx="1.5" fill="#E8670A"/>
    </svg>
    <div class="logo">Physio <span class="light">Planner</span></div>
  </div>
  <div class="meta">
    <div>${pd.patologiaFinal}</div>
    <div>${pd.idade} anos · ${pd.genero}${pd.profissao?` · ${pd.profissao}`:""}</div>
    <div>${PHASE_LABELS[pd.fase]}</div>
    <div><span>Objetivos: ${objLabels}</span></div>
    <div style="margin-top:3px;font-size:9px;color:#555">${new Date().toLocaleDateString("pt-PT")}</div>
  </div>
</div>
<div class="src"><b>Fontes consultadas:</b> ${srcH}${result.usedOwnGuidelines?' · <b style="color:#E8670A">+ Guidelines próprias</b>':""}</div>
${pd.problemaPaciente||pd.problemaFisio?`<div style="background:#f9f9f9;border-left:3px solid #E8670A;padding:8px 12px;border-radius:6px;margin-bottom:12px;font-size:12px"><b>Problema referido:</b> ${pd.problemaPaciente||"—"} &nbsp;|&nbsp; <b>Avaliação fisio:</b> ${pd.problemaFisio||"—"}</div>`:""}
<h2 style="background:#111">🏋️ Plano de Treino — ${(result.exercises||[]).length} exercícios</h2>
<table>${exRows}</table>
<div class="flags">
  <div class="flag-box"><div style="font-weight:700;font-size:12px;color:#555;margin-bottom:4px">⚠️ Cuidados</div><ul style="padding-left:14px">${(result.cuidados||[]).map(c=>`<li style="font-size:11px;margin-bottom:2px">${c}</li>`).join("")}</ul></div>
  <div class="flag-box"><div style="font-weight:700;font-size:12px;color:#c0392b;margin-bottom:4px">🚩 Red Flags</div><ul style="padding-left:14px">${(result.redFlags||[]).map(f=>`<li style="font-size:11px;margin-bottom:2px">${f}</li>`).join("")}</ul></div>
  <div class="flag-box"><div style="font-weight:700;font-size:12px;color:#e67e22;margin-bottom:4px">🟡 Yellow Flags</div><ul style="padding-left:14px">${(result.yellowFlags||[]).map(f=>`<li style="font-size:11px;margin-bottom:2px">${f}</li>`).join("")}</ul></div>
</div>
${(result.guidelinesUsed||[]).length?`<div style="background:#fff8f0;border:1px solid #E8670A;border-radius:7px;padding:9px 12px;margin-bottom:12px"><div style="font-weight:700;font-size:12px;color:#E8670A;margin-bottom:5px">📌 Artigos e Guidelines</div><ul style="padding-left:14px">${result.guidelinesUsed.map(g=>`<li style="font-size:11px;margin-bottom:2px">${g.url?`<a href="${g.url}" style="color:#E8670A">${g.ref}</a>`:g.ref}</li>`).join("")}</ul></div>`:""}
<div class="footer">
  <div style="background:#fbfbfb;border:1px solid #e8e8e8;border-radius:6px;padding:7px 10px;margin-bottom:8px;text-align:left;color:#888;font-size:9px;line-height:1.5">
    <b style="color:#666">⚕️ Aviso clínico:</b> Este plano é um apoio à decisão e não substitui o julgamento clínico. A decisão final é da responsabilidade do profissional de saúde. As referências científicas devem ser confirmadas antes de utilizadas. A progressão deve ser sempre acompanhada por um profissional de saúde.
  </div>
  Plano clínico PhysioPlanner · ${new Date().toLocaleDateString("pt-PT")} · Baseado em evidência científica
</div>
</body></html>`;
}

/* ── MAIN APP ─────────────────────────────────────────────────────────────── */
export default function App() {
  const [tab,setTab]=useState("prescricao");
  const [guidelines,setGuidelines]=useState([]);
  const [step,setStep]=useState("form");
  const [user,setUser]=useState(null);
  const [authModal,setAuthModal]=useState(null); // null | "login" | "register"
  const [userMenu,setUserMenu]=useState(false);
  const [exerciseLibrary,setExerciseLibrary]=useState([]);
  const [adminUnlocked,setAdminUnlocked]=useState(false);
  const [adminSubTab,setAdminSubTab]=useState("guidelines");
  const [adminPassInput,setAdminPassInput]=useState("");
  const [adminPassError,setAdminPassError]=useState("");
  const [lang,setLang]=useState("pt");
  useEffect(()=>{ loadLang().then(setLang); },[]);
  const changeLang=(l)=>{ setLang(l); saveLang(l); };
  const t=(key)=>tr(lang,key);

  const isAdminUser = !!user && user.email && user.email.toLowerCase()===ADMIN_EMAIL.toLowerCase();

  const tryUnlockAdmin=()=>{
    if(adminPassInput===ADMIN_PASSPHRASE){
      setAdminUnlocked(true);
      setAdminPassError("");
      setAdminPassInput("");
    } else {
      setAdminPassError("Palavra-passe incorreta.");
    }
  };

  // Restore session + exercise library on mount
  useEffect(()=>{ loadSession().then(s=>{ if(s) setUser(s); }); },[]);
  useEffect(()=>{ loadExerciseLibrary().then(setExerciseLibrary); },[]);

  const importExercises=async(parsed)=>{
    // Substitui a biblioteca (novo import = nova versão completa)
    setExerciseLibrary(parsed);
    await saveExerciseLibrary(parsed);
  };
  const clearExercises=async()=>{
    setExerciseLibrary([]);
    await saveExerciseLibrary([]);
  };

  const [form,setForm]=useState({
    idade:"",genero:"Masculino",profissao:"",patologia:PATHOLOGIES[0],fase:"aguda",outraPatologia:"",
    outrosFatores:"N/A",problemaPaciente:"",problemaFisio:"",testesEspeciais:"",fatorHistorico:""
  });
  const [objetivos,setObjetivos]=useState([]);
  const [result,setResult]=useState(null);
  const [formError,setFormError]=useState("");

  const patologiaFinal=form.patologia==="Outra patologia musculoesquelética"?form.outraPatologia:form.patologia;

  const handleFormNext=()=>{
    if(!form.idade){setFormError(lang==="en"?"Enter the patient's age.":"Insere a idade do paciente.");return;}
    if(form.patologia==="Outra patologia musculoesquelética"&&!form.outraPatologia.trim()){setFormError(lang==="en"?"Specify the condition.":"Especifica a patologia.");return;}
    setFormError("");
    if(form.patologia==="Outra patologia musculoesquelética"&&!isMSK(form.outraPatologia)){setStep("error_msk");return;}
    setStep("objetivo");
  };

  const handleGenerate=async objs=>{
    setObjetivos(objs);setStep("loading");
    const objDetails=objs.map(k=>{const o=OBJETIVOS.find(x=>x.key===k);return `- ${o.label}: ${o.presc}`;}).join("\n");
    const numEx=objs.length===2?"4 a 5 exercícios POR OBJETIVO (total 8–10 no array)":"4 a 5 exercícios";
    const ownGL=guidelines.length>0?`\nGUIDELINES PRÓPRIAS (PRIORIDADE MÁXIMA):\n${guidelines.map(g=>`- ${g.name} (${g.tag})`).join("\n")}`:"";
    const objLabelsList=objs.map(k=>OBJETIVOS.find(o=>o.key===k)?.label);

    // Sugerir nomes do banco de exercícios relevantes para esta patologia, para aumentar a
    // taxa de correspondência automática de imagens (correspondência exata de nome).
    const relevantLibrary=exerciseLibrary.filter(e=>{
      const p=normalizeText(e.patologias||"");
      return p&&normalizeText(patologiaFinal).split(" ").some(w=>w.length>3&&p.includes(w));
    }).slice(0,25);
    const libraryHint=relevantLibrary.length>0
      ? `\nBANCO DE EXERCÍCIOS DISPONÍVEL (usa o nome EXATO quando o exercício for clinicamente adequado, para ativar a imagem automática — não é obrigatório usar só estes, mas dá preferência quando fizer sentido):\n${relevantLibrary.map(e=>`- ${e.nome}`).join("\n")}`
      : "";

    const prompt=`És fisioterapeuta especialista MSK com conhecimento em guidelines internacionais. Devolve APENAS JSON válido e completo.
${lang==="en"?"\nIMPORTANT: Write ALL text content (exercise names, descriptions, cuidados, redFlags, yellowFlags, rationale, articleRef) in ENGLISH, since the clinician selected English as the interface language. Keep JSON keys in English exactly as specified below (they already are). If an exercise name is an internationally recognized term (e.g. 'Bird-Dog', 'Dead Bug', 'Glute Bridge'), prefer that exact common English name.\n":""}
PACIENTE:
- Idade: ${form.idade} | Género: ${form.genero} | Profissão: ${form.profissao||"Não indicada"}
- Patologia: ${patologiaFinal} | Fase: ${PHASE_LABELS[form.fase]}
- Testes especiais positivos: ${form.testesEspeciais||"N/A"}
- Problema do utente: ${form.problemaPaciente||"N/A"}
- Avaliação fisio: ${form.problemaFisio||"N/A"}
- Outros fatores: ${form.outrosFatores||"N/A"}
- Histórico/objetivo pessoal: ${form.fatorHistorico||"N/A"}${ownGL}${libraryHint}

OBJETIVOS E PRESCRIÇÃO:
${objDetails}

INSTRUÇÕES:
- Gera ${numEx} baseados em evidência para a patologia e fase
- Campo "objetivo": preencher com label exato: ${objLabelsList.join(" ou ")}
- Campo "rationale": 1 frase justificando clinicamente o exercício
- Campo "guideline": nome da guideline ou artigo que suporta (ex: "NICE 2016", "Cochrane 2021")
- Descrições: máx 2 frases curtas
- IMPORTANTE — REFERÊNCIAS (regra crítica de fiabilidade): só inclui "articleLink" quando tiveres ALTA confiança de que o PMID é real e corresponde exatamente ao artigo citado. Na dúvida, deixa "articleLink" e "articleRef" VAZIOS — é MUITO melhor não ter referência do que ter uma referência inventada. Cada referência será verificada automaticamente contra a base oficial do PubMed e as que não existirem serão removidas. Não percas tempo a inventar: prefere referências de guidelines amplamente conhecidas (NICE, JOSPT, Cochrane) cujos PMID conheces com certeza, ou deixa vazio.
- Preferência: é aceitável que vários exercícios fiquem sem "articleLink". O campo "guideline" (texto, ex: "NICE 2016") pode ser preenchido mesmo sem PMID.
- Adapta à profissão, género e comorbilidades

JSON EXATO:
{"exercises":[{"name":"","description":"","sets":"","reps":"","intensity":"","rest":"","frequency":"","objetivo":"","rationale":"","guideline":"","articleRef":"","articleLink":""}],"cuidados":["","","",""],"redFlags":["","",""],"yellowFlags":["","",""],"guidelinesUsed":[{"ref":"","url":""}],"sources":[{"name":"PubMed","url":"https://pubmed.ncbi.nlm.nih.gov"},{"name":"PEDro","url":"https://pedro.org.au"},{"name":"Cochrane","url":"https://cochranelibrary.com"}],"usedOwnGuidelines":${guidelines.length>0}}`;

    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-5",max_tokens:4000,
          system:"Responde EXCLUSIVAMENTE com JSON válido e completo. Zero texto extra, zero markdown, zero backticks. JSON 100% bem formado. REGRA CRÍTICA: nunca uses aspas duplas (\") dentro dos valores de texto — se precisares de citar algo, usa aspas simples (') ou parênteses. As aspas duplas só podem delimitar as chaves e os valores do JSON.",
          messages:[{role:"user",content:prompt}]
        })
      });
      const data=await res.json();
      if(data.error)throw new Error(data.error.message);
      let raw=(data.content||[]).map(b=>b.type==="text"?b.text:"").join("").trim();
      let clean=raw.replace(/^```(?:json)?\s*/,"").replace(/\s*```$/,"").trim();
      if(!clean.endsWith("}")){
        clean=clean.replace(/,\s*"[^"]*"\s*:\s*[^,}\]]*$/,"");
        const op=(clean.match(/\[/g)||[]).length-(clean.match(/\]/g)||[]).length;
        const ob=(clean.match(/\{/g)||[]).length-(clean.match(/\}/g)||[]).length;
        for(let i=0;i<op;i++)clean+="]";
        for(let i=0;i<ob;i++)clean+="}";
      }
      let parsed;
      try{
        parsed=JSON.parse(clean);
      }catch(parseErr){
        // Tentativa de reparação: escapar aspas duplas que aparecem dentro de valores de texto
        const repaired=repairJsonQuotes(clean);
        parsed=JSON.parse(repaired); // se falhar outra vez, cai no catch exterior
      }
      // Cruzar cada exercício com o banco de exercícios (correspondência exata apenas)
      if(exerciseLibrary.length>0&&parsed.exercises){
        parsed.exercises=parsed.exercises.map(ex=>{
          const match=matchExercise(ex.name,exerciseLibrary);
          if(!match) return ex;
          const updated={...ex,_libraryMatch:true};
          if(!ex.imageLink&&isValidUrl(match.imagem)) updated.imageLink=cloudinaryOptimize(match.imagem);
          if(!ex.videoLink&&isValidUrl(match.video)) updated.videoLink=match.video;
          return updated;
        });
      }
      setResult(parsed);setStep("result");
    } catch(e){
      console.error(e);setFormError(`Erro: ${e.message}. Tenta novamente.`);setStep("form");
    }
  };

  const reset=()=>{setStep("form");setResult(null);setFormError("");setObjetivos([]);};
  const patientData={...form,patologiaFinal};

  const logout=async()=>{ await saveSession(null); setUser(null); setUserMenu(false); setAdminUnlocked(false); setTab("prescricao"); };

  return (
    <div style={{maxWidth:780,margin:"0 auto",fontFamily:"Arial,sans-serif",paddingBottom:40,background:"#fff",position:"relative"}}>
      {authModal&&<AuthModal mode={authModal} onClose={()=>setAuthModal(null)} onAuth={s=>{setUser(s);setAuthModal(null);}} t={t} lang={lang}/>}

      {/* ── HEADER ── */}
      <div style={{background:DARK,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <Logo height={40}/>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <LangSwitch lang={lang} onChange={changeLang}/>
          {!user ? (
            <>
              <button onClick={()=>setAuthModal("register")} style={{background:"none",border:"1px solid #444",color:"#ddd",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:600}}>{t("register")}</button>
              <button onClick={()=>setAuthModal("login")} style={{background:ORANGE,border:"none",color:"#fff",borderRadius:8,padding:"6px 16px",fontSize:12,cursor:"pointer",fontWeight:700}}>{t("login")}</button>
            </>
          ) : (
            <div style={{position:"relative"}}>
              <button onClick={()=>setUserMenu(m=>!m)} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"1px solid #444",borderRadius:8,padding:"5px 12px",cursor:"pointer"}}>
                <span style={{width:24,height:24,borderRadius:"50%",background:ORANGE,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>{(user.name||user.email)[0].toUpperCase()}</span>
                <span style={{color:"#ddd",fontSize:12,fontWeight:600}}>{user.name}</span>
                <span style={{color:"#888",fontSize:9}}>▼</span>
              </button>
              {userMenu&&(
                <div style={{position:"absolute",top:"110%",right:0,background:"#fff",borderRadius:10,boxShadow:"0 6px 20px rgba(0,0,0,0.2)",padding:"8px",minWidth:180,zIndex:50}}>
                  <div style={{padding:"6px 10px",borderBottom:"1px solid #eee",marginBottom:4}}>
                    <div style={{fontSize:12,fontWeight:700}}>{user.name}</div>
                    <div style={{fontSize:11,color:"#888"}}>{user.email}</div>
                    <div style={{fontSize:9,color:ORANGE,marginTop:2}}>{user.provider==="google"?"🔵 Google":"✉️ Email"}</div>
                  </div>
                  <button onClick={logout} style={{width:"100%",textAlign:"left",background:"none",border:"none",padding:"7px 10px",fontSize:12,color:"#c0392b",cursor:"pointer",borderRadius:6}}>{t("logout")}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN TABS ── */}
      <div style={{display:"flex",borderBottom:`2px solid ${DARK}`,flexWrap:"wrap"}}>
        {[["prescricao",t("navPrescricao")],["historico",t("navHistorico")],...(isAdminUser?[["admin",t("navAdmin")]]:[])].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"9px 14px",border:"none",background:tab===k?ORANGE:GRAY,color:tab===k?"#fff":"#555",fontWeight:tab===k?700:400,cursor:"pointer",fontSize:13,borderBottom:tab===k?`2px solid ${ORANGE}`:"none",marginBottom:-2}}>{l}</button>
        ))}
      </div>

      <div style={{padding:"18px 16px"}}>
        {tab==="admin"&&isAdminUser&&(
          !adminUnlocked ? (
            <div style={{maxWidth:340,margin:"30px auto",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:10}}>🔐</div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>{t("adminArea")}</div>
              <p style={{fontSize:12,color:"#888",marginBottom:14}}>{t("adminSub")}</p>
              <input type="password" value={adminPassInput} onChange={e=>setAdminPassInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&tryUnlockAdmin()}
                placeholder={t("fraseP")} autoFocus
                style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #ddd",fontSize:13,boxSizing:"border-box",marginBottom:8,textAlign:"center"}}/>
              {adminPassError&&<p style={{color:"#c0392b",fontSize:12,marginBottom:8}}>{adminPassError}</p>}
              <button onClick={tryUnlockAdmin} style={{background:ORANGE,color:"#fff",border:"none",borderRadius:10,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>{t("desbloquear")}</button>
              <p style={{fontSize:10,color:"#bbb",marginTop:14,lineHeight:1.5}}>{lang==="en"?"⚠️ This is a deterrent layer, not real security — the code runs in the browser. Do not enter sensitive data relying on this alone.":"⚠️ Esta é uma camada de dissuasão, não segurança real — o código corre no browser. Não introduzas dados sensíveis a confiar apenas nisto."}</p>
            </div>
          ) : (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{display:"flex",gap:6}}>
                  {[["guidelines","📁 Guidelines"],["exercicios",lang==="en"?"🗂️ Exercise Bank":"🗂️ Banco de Exercícios"]].map(([k,l])=>(
                    <button key={k} onClick={()=>setAdminSubTab(k)} style={{padding:"7px 14px",border:"none",borderRadius:7,background:adminSubTab===k?DARK:GRAY,color:adminSubTab===k?"#fff":"#555",fontWeight:600,cursor:"pointer",fontSize:12}}>{l}</button>
                  ))}
                </div>
                <button onClick={()=>setAdminUnlocked(false)} style={{background:"none",border:"1px solid #ddd",borderRadius:7,padding:"6px 12px",fontSize:11,color:"#888",cursor:"pointer"}}>{t("bloquear")}</button>
              </div>
              {adminSubTab==="guidelines"&&<GuidelinesLibrary guidelines={guidelines} onAdd={g=>setGuidelines(p=>[...p,g])} onRemove={id=>setGuidelines(p=>p.filter(g=>g.id!==id))} t={t}/>}
              {adminSubTab==="exercicios"&&<ExerciseLibraryPanel library={exerciseLibrary} onImport={importExercises} onClear={clearExercises} t={t} lang={lang}/>}
            </div>
          )
        )}

        {tab==="historico"&&(
          <HistoryView
            user={user}
            t={t} lang={lang}
            onRequireLogin={()=>setAuthModal("login")}
            onOpenPlan={p=>{
              setForm(f=>({...f,...p.patient_data}));
              setObjetivos(p.objetivos||[]);
              setResult(p.result);
              setTab("prescricao");
              setStep("result");
            }}
          />
        )}

        {tab==="prescricao"&&<>
          {/* ── FORM ── */}
          {step==="form"&&(
            <div>
              <p style={{color:"#666",fontSize:13,marginBottom:14}}>{t("formIntro")}</p>
              <RGPDNotice t={t} lang={lang}/>
              {guidelines.length>0&&<div style={{background:"#fff8f0",border:`1px solid ${ORANGE}`,borderRadius:8,padding:"6px 12px",marginBottom:10,fontSize:12}}><b style={{color:ORANGE}}>📁 {guidelines.length} {t("ownGuidelinesActive")}</b></div>}

              <div style={{display:"grid",gridTemplateColumns:"80px 130px 1fr",gap:10,marginBottom:10}}>
                <div><Label>{t("idade")}</Label><Input type="number" min="1" max="120" value={form.idade} onChange={e=>setForm(f=>({...f,idade:e.target.value}))} placeholder="45"/></div>
                <div><Label>{t("genero")}</Label><Sel value={form.genero} onChange={e=>setForm(f=>({...f,genero:e.target.value}))}><option>{t("masculino")}</option><option>{t("feminino")}</option><option>{t("outroGenero")}</option></Sel></div>
                <div><Label>{t("profissao")}</Label><Input value={form.profissao} onChange={e=>setForm(f=>({...f,profissao:e.target.value}))} placeholder={t("profissaoPh")}/></div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><Label>{t("patologia")}</Label><Sel value={form.patologia} onChange={e=>setForm(f=>({...f,patologia:e.target.value}))}>{PATHOLOGIES.map(p=><option key={p} value={p}>{pathoLabel(p,lang)}</option>)}</Sel></div>
                <div><Label>{t("faseLesao")}</Label><Sel value={form.fase} onChange={e=>setForm(f=>({...f,fase:e.target.value}))}>{Object.keys(PHASE_LABELS).map(k=><option key={k} value={k}>{phaseLabel(k,lang)}</option>)}</Sel></div>
              </div>

              {form.patologia==="Outra patologia musculoesquelética"&&(
                <div style={{marginBottom:10}}><Label>{t("especificaPatologia")}</Label><Input value={form.outraPatologia} onChange={e=>setForm(f=>({...f,outraPatologia:e.target.value}))} placeholder={t("especificaPatologiaPh")}/></div>
              )}

              <div style={{marginBottom:10}}>
                <Label>{t("testesEspeciais")}</Label>
                <Input value={form.testesEspeciais}
                  onChange={e=>setForm(f=>({...f,testesEspeciais:e.target.value}))}
                  placeholder={t("testesEspeciaisPh")}/>
                <div style={{fontSize:10,color:"#aaa",marginTop:3}}>{t("testesEspeciaisNota")}</div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><Label>{t("problemaPaciente")}</Label><Textarea value={form.problemaPaciente} onChange={e=>setForm(f=>({...f,problemaPaciente:e.target.value}))} placeholder={t("problemaPacientePh")} rows={3}/></div>
                <div><Label>{t("problemaFisio")}</Label><Textarea value={form.problemaFisio} onChange={e=>setForm(f=>({...f,problemaFisio:e.target.value}))} placeholder={t("problemaFisioPh")} rows={3}/></div>
              </div>

              <div style={{marginBottom:10}}>
                <Label>{t("outrosFatores")}</Label>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <Input value={form.outrosFatores} onChange={e=>setForm(f=>({...f,outrosFatores:e.target.value}))} placeholder={t("outrosFatoresPh")} style={{flex:1}}/>
                  <button onClick={()=>setForm(f=>({...f,outrosFatores:"N/A"}))} style={{background:GRAY,border:"1px solid #ddd",borderRadius:7,padding:"8px 10px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap",color:"#666"}}>N/A</button>
                </div>
              </div>

              <div style={{marginBottom:14}}>
                <Label>{t("fatorHistorico")}</Label>
                <Input value={form.fatorHistorico} onChange={e=>setForm(f=>({...f,fatorHistorico:e.target.value}))} placeholder={t("fatorHistoricoPh")}/>
              </div>

              {formError&&<p style={{color:"#c0392b",fontSize:12,marginBottom:10}}>{formError}</p>}
              <button onClick={handleFormNext} style={{background:ORANGE,color:"#fff",border:"none",borderRadius:10,padding:"11px 0",fontSize:14,fontWeight:700,cursor:"pointer",width:"100%"}}>
                {t("continuar")}
              </button>
              <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:5}}>
                {["PubMed","Cochrane","PEDro","JOSPT","NICE","WHO"].map(s=><span key={s} style={{background:GRAY,borderRadius:5,padding:"2px 8px",fontSize:10,color:"#777"}}>{s}</span>)}
              </div>
              <ClinicalDisclaimer t={t}/>
            </div>
          )}

          {step==="objetivo"&&<ObjetivoStep patientData={patientData} onConfirm={handleGenerate} onBack={()=>setStep("form")} t={t} lang={lang}/>}
          {step==="loading"&&<Spinner t={t}/>}
          {step==="result"&&result&&<ResultView result={result} onBack={reset} patientData={patientData} objetivos={objetivos} guidelines={guidelines} user={user} onRequireLogin={()=>setAuthModal("login")} t={t} lang={lang}/>}

          {step==="error_msk"&&(
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:44,marginBottom:12}}>⚠️</div>
              <div style={{fontWeight:700,fontSize:17,marginBottom:10}}>{t("patologiaForaAmbito")}</div>
              <p style={{fontSize:13,color:"#666",maxWidth:360,margin:"0 auto 18px"}}>"<b>{form.outraPatologia}</b>" {lang==="en"?"does not appear to be a musculoskeletal condition. This application is exclusively for musculoskeletal rehabilitation.":"não parece ser uma condição musculoesquelética. Esta aplicação destina-se exclusivamente à reabilitação MSK."}</p>
              <button onClick={()=>setStep("form")} style={{background:ORANGE,color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>{t("voltarCorrigir")}</button>
            </div>
          )}
        </>}
      </div>

      {/* ── RODAPÉ GLOBAL ── */}
      <div style={{borderTop:"1px solid #eee",padding:"14px 18px",marginTop:10,textAlign:"center"}}>
        <div style={{fontSize:10,color:"#aaa",lineHeight:1.5}}>
          <b style={{color:"#999"}}>Physio Planner</b> · {t("footerTagline")}
          <br/>{t("footerDisclaimer")}
        </div>
        <div style={{fontSize:10,color:"#c2c2c2",marginTop:8}}>
          {t("footerCredit")}
        </div>
      </div>
    </div>
  );
}