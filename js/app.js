/* ============================================================
   app.js — Sessão, login, navegação global
   PAD Digital · Polícia Penal SC
   ============================================================ */

/* ===== SESSÃO ===== */
var SESSAO = { perfil: 'coord', nome: '', id: null };
var advDB = []; // [{id,nome,oab,pads:[]}]

function loginSel(p){
  SESSAO.perfil = p;
  var coord = document.getElementById('lp-coord');
  var adv   = document.getElementById('lp-adv');
  var cc    = document.getElementById('login-campo-coord');
  var ca    = document.getElementById('login-campo-adv');
  if(p === 'coord'){
    coord.style.border = '2px solid #222222'; coord.style.background = '#F0F0F0';
    coord.querySelector('i').style.color = '#222222';
    adv.style.border   = '2px solid #e0e0e0'; adv.style.background = '#fff';
    adv.querySelector('i').style.color = '#aaa';
    cc.style.display = 'block'; ca.style.display = 'none';
  } else {
    adv.style.border = '2px solid #222222'; adv.style.background = '#F0F0F0';
    adv.querySelector('i').style.color = '#222222';
    coord.style.border = '2px solid #e0e0e0'; coord.style.background = '#fff';
    coord.querySelector('i').style.color = '#aaa';
    cc.style.display = 'none'; ca.style.display = 'block';
    var senhaEl = document.getElementById('login-senha-adv'); if(senhaEl) senhaEl.value = '';
    var erroEl  = document.getElementById('login-erro-senha'); if(erroEl) erroEl.style.display = 'none';
    // Popula select
    var sel = document.getElementById('login-sel-adv');
    var sem = document.getElementById('login-sem-adv');
    sel.innerHTML = '<option value="">— selecione —</option>';
    advDB.forEach(function(a){
      sel.innerHTML += '<option value="'+a.id+'">'+a.nome+' ('+a.oab+')</option>';
    });
    sel.style.display = advDB.length ? 'block' : 'none';
    sem.style.display  = advDB.length ? 'none'  : 'block';
  }
}

function loginEntrar(){
  if(SESSAO.perfil === 'coord'){
    var nome = (document.getElementById('login-nome').value||'').trim() || 'Coordenador';
    SESSAO.nome = nome;
    document.getElementById('tela-login').style.display = 'none';
    // Badge
    var b = document.getElementById('badge-perfil');
    b.textContent = nome; b.className = 'badge-perfil bp-srv';
    // Nav: mostra tudo
    ['nav-painel','nav-ocorrencia','nav-pads','nav-modelos','nav-acomp','nav-notif','nav-acesso','nav-calendario'].forEach(function(id){
      var el = document.getElementById(id); if(el) el.style.display = '';
    });
    goTab('painel');
  } else {
    var id = document.getElementById('login-sel-adv').value;
    if(!id){ alert('Selecione seu cadastro na lista.'); return; }
    var adv = advDB.find(function(a){ return a.id === id; });
    if(!adv){ alert('Cadastro não encontrado.'); return; }
    var senhaDigitada = (document.getElementById('login-senha-adv').value||'').trim();
    var erroEl = document.getElementById('login-erro-senha');
    if(!senhaDigitada){ erroEl.textContent='Digite sua senha.'; erroEl.style.display='block'; return; }
    if(senhaDigitada !== adv.senha){ erroEl.textContent='Senha incorreta. Tente novamente.'; erroEl.style.display='block'; document.getElementById('login-senha-adv').value=''; return; }
    erroEl.style.display='none';
    // Primeiro acesso: forçar troca de senha
    if(adv.primeiroAcesso){
      abrirModalTrocarSenha(adv.id, true);
      return;
    }
    entrarComoAdvogado(adv);
  }
}

function loginSair(){
  // Reseta filtros
  document.querySelectorAll('#tabela-pads tr').forEach(function(tr){ tr.style.display = ''; });
  // Restaura botões
  var btnNovo = document.getElementById('btn-novo-pad');
  var btnMsg  = document.getElementById('btn-msg-unidade');
  if(btnNovo) btnNovo.style.display = '';
  if(btnMsg)  btnMsg.style.display  = 'none';
  // Reset notif view
  var vc = document.getElementById('notif-view-coord');
  var va = document.getElementById('notif-view-adv');
  if(vc) vc.style.display = 'block';
  if(va) va.style.display = 'none';
  // Reset badge
  var nb = document.querySelector('#nav-notif .nb');
  if(nb){ nb.textContent = '3'; nb.style.display = ''; }
  var navPortal = document.getElementById('nav-portal'); if(navPortal) navPortal.style.display = 'none';
  SESSAO = { perfil: 'coord', nome: '', id: null };
  loginSel('coord');
  document.getElementById('login-nome').value = 'Leila DPP / CEPEN';
  var btnTS = document.getElementById('btn-trocar-senha-adv'); if(btnTS) btnTS.style.display = 'none';
  document.getElementById('tela-login').style.display = 'flex';
}


/* ===== DADOS GLOBAIS ===== */
var DAD={nome:'',ipen:'',data:'',art:'Art. 50, VII da LEP',grau:'Grave',local:'',agentes:'',desc:'',defensor:'',portaria:'',sgpe:'',diretor:'Beltrano dos Santos'};
var OCORR_B64='';
var OCORR_NOME='';
var curMod=null;
var dadosCarregados=false;
var CABECALHO="";
var RODAPE="\n\nDEPARTAMENTO DE POLÍCIA PENAL DE SANTA CATARINA\nRua Fúlvio Aducci, 1214, 6º andar, Estreito – Florianópolis/SC\nTelefone: (48) 3665-7310";

/* ===== NAVEGAÇÃO ===== */
function goTab(t){
  document.querySelectorAll('.tab').forEach(function(e){e.classList.remove('on')});
  document.querySelectorAll('.sec').forEach(function(e){e.classList.remove('on')});
  var navEl = document.getElementById('nav-'+t);
  if(navEl) navEl.classList.add('on');
  var s = document.getElementById('s-'+t);
  if(s) s.classList.add('on');
  if(t === 'acesso') renderCadProcessos();
  if(t === 'acomp') atualizarSelectPAD();
  if(t === 'modelos') atualizarSelectPADModelos();
  if(t === 'notif'){
    var isAdv = SESSAO.perfil === 'adv';
    var vc = document.getElementById('notif-view-coord');
    var va = document.getElementById('notif-view-adv');
    if(vc) vc.style.display = isAdv ? 'none' : 'block';
    if(va) va.style.display = isAdv ? 'block' : 'none';
    if(isAdv && SESSAO.id){ renderNotifAdv(SESSAO.id); atualizarBadgeAdv(SESSAO.id); }
  }
}

function abrirModelo(k){
  goTab('modelos');
  setTimeout(function(){selMod(k);},60);
}

// togglePerfil removed

/* ============================================================
   Inicialização — carrega dados após o DOM estar pronto
   ============================================================ */
document.addEventListener('DOMContentLoaded', function(){
  storageInit();
  if(typeof prazosInit === 'function') prazosInit();
  if(typeof renderCal === 'function') renderCal();
  if(typeof atualizarSelectPAD === 'function') atualizarSelectPAD();
  if(typeof atualizarSelectPADModelos === 'function') atualizarSelectPADModelos();
  if(typeof atualizarBadgeMsgs === 'function') atualizarBadgeMsgs();
});
