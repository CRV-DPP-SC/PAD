/* ============================================================
   storage.js — Camada de persistência (Fase 1)
   PAD Digital · Polícia Penal SC

   Todas as leituras e escritas de dados passam por aqui.
   Fase 1: localStorage.
   Fase futura: trocar apenas este arquivo para IndexedDB ou API.
   ============================================================ */

var Storage = (function(){
  var PREFIX = 'pad_';

  function _key(k){ return PREFIX + k; }

  function get(k){
    try{
      var raw = localStorage.getItem(_key(k));
      return raw !== null ? JSON.parse(raw) : null;
    }catch(e){
      console.warn('[Storage] Erro ao ler "'+k+'":', e);
      return null;
    }
  }

  function set(k, val){
    try{
      localStorage.setItem(_key(k), JSON.stringify(val));
    }catch(e){
      /* QuotaExceededError: armazenamento cheio */
      if(e.name === 'QuotaExceededError' || e.code === 22){
        console.error('[Storage] localStorage cheio. Não foi possível salvar "'+k+'".');
        alert('Atenção: o armazenamento local está cheio.\nAlguns dados podem não ter sido salvos.\nConsidere exportar e limpar dados antigos.');
      }else{
        console.error('[Storage] Erro ao salvar "'+k+'":', e);
      }
    }
  }

  function remove(k){
    try{ localStorage.removeItem(_key(k)); }catch(e){}
  }

  function clear(){
    try{
      Object.keys(localStorage).forEach(function(k){
        if(k.indexOf(PREFIX) === 0) localStorage.removeItem(k);
      });
    }catch(e){}
  }

  /* ---- Helpers de tamanho ---- */
  function sizeKB(){
    var total = 0;
    try{
      Object.keys(localStorage).forEach(function(k){
        if(k.indexOf(PREFIX) === 0){
          total += (localStorage.getItem(k)||'').length;
        }
      });
    }catch(e){}
    return Math.round(total / 1024);
  }

  return { get:get, set:set, remove:remove, clear:clear, sizeKB:sizeKB };
})();

/* ============================================================
   Funções de carregamento e salvamento por domínio
   ============================================================ */

/* Dados iniciais de demonstração — usados apenas quando o
   localStorage está vazio (primeira abertura do sistema).    */
var _DEMO_PADS = {
  '110/2025': {
    portaria:'110/2025', nome:'Ciclano de Tal', ipen:'000001',
    art:'Art. 50, VII LEP', defensor:'— sem defensor',
    statusCls:'sw', statusTxt:'Aguarda VEP',
    etapas:{
      portaria:{data:'12/11/2025',obs:'Beltrano dos Santos'},
      intimacao:{data:'18/11/2025',obs:'DPP'},
      oitivas:{data:'27/02/2026',obs:'Incidentado e testemunhas'},
      relatorio:{data:'04/03/2026',obs:'Conselho Disciplinar'},
      defesa:{data:'10/03/2026',obs:'Leila DPP'},
      decisao_dir:{data:'13/03/2026',obs:'Beltrano dos Santos'},
      decisao_jud:{data:'',obs:''}
    },
    timeline:[
      {titulo:'Portaria nº 110/2025 — instauração',   data:'12/11/2025', obs:'Beltrano dos Santos', docs:[]},
      {titulo:'Isolamento preventivo aplicado',         data:'12/11/2025', obs:'10 dias + 20 dias recolhimento', docs:[]},
      {titulo:'Oitiva do incidentado',                  data:'27/02/2026', obs:'Dr. Leila DPP presente', docs:[]},
      {titulo:'Oitiva das testemunhas',                 data:'27/02/2026', obs:'Agente A. Testemunha e Agente B. Testemunha', docs:[]},
      {titulo:'Defesa técnica juntada',                 data:'10/03/2026', obs:'Leila DPP, DPP', docs:[]},
      {titulo:'Relatório conclusivo — falta grave',     data:'04/03/2026', obs:'Conselho Disciplinar — unanimidade', docs:[]},
      {titulo:'Decisão da direção — corroborou CD',     data:'13/03/2026', obs:'Beltrano dos Santos', docs:[]},
      {titulo:'Aguardando homologação judicial',        data:'', obs:'Encaminhado à VEP', docs:[], pendente:true}
    ],
    intimacoes:[
      {titulo:'Intimado — oitiva do incidentado', info:'Leila DPP — 24/02/2026', ok:'✓ Confirmado pelo defensor'},
      {titulo:'Intimado — prazo defesa (10 dias)', info:'Leila DPP — 27/02/2026', ok:'✓ Defesa juntada em 10/03/2026'}
    ]
  },
  '125/2025': {
    portaria:'125/2025', nome:'Beltrano dos Santos', ipen:'000003',
    art:'Art. 50, VII LEP', defensor:'— sem defensor',
    statusCls:'sa', statusTxt:'Andamento',
    etapas:{portaria:{data:'25/05/2026',obs:''}}, timeline:[
      {titulo:'Portaria nº 125/2025 — instauração', data:'25/05/2026', obs:'', docs:[]},
      {titulo:'Defesa técnica juntada', data:'15/04/2026', obs:'DPE/SC', docs:[]}
    ], intimacoes:[]
  },
  '033/2025': {
    portaria:'033/2025', nome:'Fulano da Silva', ipen:'000002',
    art:'Art. 50, VII LEP', defensor:'— sem defensor',
    statusCls:'sp', statusTxt:'Crítico',
    etapas:{portaria:{data:'15/05/2026',obs:''}}, timeline:[
      {titulo:'Portaria nº 033/2025 — instauração', data:'15/05/2026', obs:'', docs:[]},
      {titulo:'Prazo de defesa em aberto', data:'26/05/2026', obs:'Sem defensor constituído', docs:[], pendente:true}
    ], intimacoes:[]
  },
  '098/2025': {
    portaria:'098/2025', nome:'Fulano da Silva', ipen:'646006',
    art:'Art. 50, VII LEP', defensor:'DPE/SC (27ª)',
    statusCls:'sc', statusTxt:'Concluído',
    etapas:{}, timeline:[
      {titulo:'Portaria nº 098/2025 — instauração', data:'', obs:'', docs:[]},
      {titulo:'PAD concluído e homologado', data:'', obs:'VEP — homologado', docs:[]}
    ], intimacoes:[]
  }
};

var _DEMO_PADS_DB = [
  {pad:'110/2025', nome:'Ciclano de Tal',      ipen:'000001', defensor:'Leila DPP',          email:'leila@dpp.gov.br'},
  {pad:'125/2025', nome:'Beltrano dos Santos',  ipen:'000003', defensor:'Leila DPP',          email:'leila@dpp.gov.br'},
  {pad:'033/2025', nome:'Fulano da Silva',       ipen:'000002', defensor:'',                   email:''},
  {pad:'098/2025', nome:'Fulano da Silva',       ipen:'646006', defensor:'DPE/SC - 27ª Capital',email:'leila@dpp.gov.br'}
];

/* ---- PADs ---- */
function storageSalvarPads(){
  Storage.set('padsData', padsData);
}
function storageCarregarPads(){
  var saved = Storage.get('padsData');
  if(saved && typeof saved === 'object' && Object.keys(saved).length > 0){
    padsData = saved;
  }else{
    padsData = JSON.parse(JSON.stringify(_DEMO_PADS));
  }
}

/* ---- PADS_DB (índice de apenados para busca) ---- */
function storageSalvarPadsDB(){
  Storage.set('padsDB', PADS_DB);
}
function storageCarregarPadsDB(){
  var saved = Storage.get('padsDB');
  if(saved && Array.isArray(saved) && saved.length > 0){
    PADS_DB = saved;
  }else{
    PADS_DB = JSON.parse(JSON.stringify(_DEMO_PADS_DB));
  }
}

/* ---- Dados da ocorrência em edição ---- */
function storageSalvarOcorrencia(){
  Storage.set('dadOcorrencia', DAD);
  Storage.set('ocorrArquivoNome', OCORR_NOME);
  /* OCORR_B64 pode ser grande (PDF em base64).
     Salvamos separado e com try/catch extra.      */
  if(OCORR_B64){
    try{ Storage.set('ocorrArquivoB64', OCORR_B64); }catch(e){}
  }else{
    Storage.remove('ocorrArquivoB64');
  }
}
function storageCarregarOcorrencia(){
  var dad = Storage.get('dadOcorrencia');
  if(dad) DAD = dad;
  OCORR_NOME = Storage.get('ocorrArquivoNome') || '';
  OCORR_B64  = Storage.get('ocorrArquivoB64')  || '';
}

/* ---- Oitivas ---- */
function storageSalvarOitivas(){
  Storage.set('oitivas', oitivas);
}
function storageCarregarOitivas(){
  var saved = Storage.get('oitivas');
  if(saved && Array.isArray(saved)){
    oitivas = saved;
  }
}

/* ---- Advogados ---- */
function storageSalvarAdvDB(){
  Storage.set('advDB', advDB);
}
function storageCarregarAdvDB(){
  var saved = Storage.get('advDB');
  if(saved && Array.isArray(saved)){
    advDB = saved;
  }
}

/* ---- Mensagens ---- */
function storageSalvarMensagens(){
  Storage.set('mensagensDB',  mensagensDB);
  Storage.set('alertasMsgs',  alertasMsgs);
  Storage.set('alertasAdv',   alertasAdv);
}
function storageCarregarMensagens(){
  var m = Storage.get('mensagensDB');
  if(m && typeof m === 'object') mensagensDB = m;

  var a = Storage.get('alertasMsgs');
  if(a && Array.isArray(a)) alertasMsgs = a;

  var adv = Storage.get('alertasAdv');
  if(adv && typeof adv === 'object') alertasAdv = adv;
}

/* ---- Sessão ---- */
function storageSalvarSessao(){
  Storage.set('sessao', SESSAO);
}
function storageCarregarSessao(){
  var s = Storage.get('sessao');
  if(s && typeof s === 'object' && s.perfil){
    SESSAO = s;
  }
}

/* ============================================================
   storageInit() — Chamado uma vez ao carregar a página.
   Carrega todos os dados persistidos.
   ============================================================ */
function storageInit(){
  storageCarregarPads();
  storageCarregarPadsDB();
  storageCarregarOcorrencia();
  storageCarregarOitivas();
  storageCarregarAdvDB();
  storageCarregarMensagens();
  /* Não restauramos sessão para forçar login a cada abertura. */
}
