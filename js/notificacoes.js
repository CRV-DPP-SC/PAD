/* ============================================================
   notificacoes.js — Mensagens, notificações e alertas
   PAD Digital · Polícia Penal SC
   ============================================================ */

/* ===== MENSAGENS À UNIDADE ===== */
var mensagensDB = {}; // { portaria: [{id, de, assunto, texto, data, lida}] }

var assuntoLabels = {
  vista:   'Solicitação de vista dos autos',
  prazo:   'Pedido de prazo / prorrogação',
  oitiva:  'Agendamento de oitiva',
  juntada: 'Aviso de juntada de documento',
  info:    'Solicitação de informação',
  outro:   'Outro assunto'
};

function abrirModalMensagem(){
  // Popula select de PADs autorizados para este advogado
  var sel = document.getElementById('msg-pad');
  sel.innerHTML = '<option value="">— selecione o processo —</option>';
  document.querySelectorAll('#tabela-pads tr').forEach(function(tr){
    if(tr.style.display === 'none') return;
    var td = tr.querySelector('td strong');
    if(!td) return;
    var p = td.textContent.trim();
    sel.innerHTML += '<option value="'+p+'">'+p+'</option>';
  });
  document.getElementById('msg-texto').value = '';
  document.getElementById('msg-assunto').value = 'vista';
  document.getElementById('msg-historico-wrap').style.display = 'none';
  sel.onchange = function(){ renderHistoricoModal(this.value); };
  // Se já tem um processo pré-selecionado (ex: vindo de notificação), mostra histórico
  if(sel.value) renderHistoricoModal(sel.value);
  setTimeout(function(){ document.getElementById('modal-mensagem').style.display = 'flex'; }, 10);
}

function fecharModalMensagem(){
  document.getElementById('modal-mensagem').style.display = 'none';
}

function renderHistoricoModal(portaria){
  var wrap = document.getElementById('msg-historico-wrap');
  var cont = document.getElementById('msg-historico');
  if(!portaria || !mensagensDB[portaria] || !mensagensDB[portaria].length){
    wrap.style.display = 'none'; return;
  }
  wrap.style.display = 'block';
  cont.innerHTML = '';
  mensagensDB[portaria].forEach(function(m){
    var isAdv = m.de !== 'Unidade';
    var div = document.createElement('div');
    div.style.cssText = 'padding:9px 12px;border-radius:8px;font-size:12px;'
      + (isAdv ? 'background:#F0F0F0;border:1px solid #CCCCCC;margin-left:20px' : 'background:#F2FAF0;border:1px solid #C0DD97;margin-right:20px');
    div.innerHTML = '<div style="font-weight:700;margin-bottom:3px;color:'+(isAdv?'#111111':'#27500A')+'">'
      +(isAdv ? '<i class="ti ti-user" style="margin-right:4px"></i>' : '<i class="ti ti-building" style="margin-right:4px"></i>')
      +m.de+' <span style="font-weight:400;color:#999;font-size:10px;margin-left:6px">'+m.data+'</span></div>'
      +'<div style="color:#555;margin-bottom:2px;font-size:10px;font-weight:600">'+assuntoLabels[m.assunto]||m.assunto+'</div>'
      +'<div>'+m.texto+'</div>';
    cont.appendChild(div);
  });
  cont.scrollTop = cont.scrollHeight;
}

function enviarMensagem(){
  var portaria = document.getElementById('msg-pad').value;
  var assunto  = document.getElementById('msg-assunto').value;
  var texto    = document.getElementById('msg-texto').value.trim();
  if(!portaria){ alert('Selecione o processo.'); return; }
  if(!texto){ alert('Escreva uma mensagem.'); return; }

  if(!mensagensDB[portaria]) mensagensDB[portaria] = [];
  var agora = new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});
  var remetente = SESSAO.perfil === 'coord' ? 'Unidade' : (SESSAO.nome || 'Advogado');
  mensagensDB[portaria].push({
    id: Date.now(),
    de: remetente,
    assunto: assunto,
    texto: texto,
    data: agora,
    lida: false
  });

  // Adiciona notificação apenas se remetente for advogado
  if(SESSAO.perfil !== 'coord'){
    adicionarNotifMensagem(portaria, assunto, SESSAO.nome || 'Advogado', texto);
  }

  document.getElementById('msg-texto').value = '';
  storageSalvarMensagens();
  renderHistoricoModal(portaria);
  mostrarToast('Mensagem enviada à unidade!', 'success');
}

/* banco de alertas de mensagens não lidas para o coordenador */
var alertasMsgs = []; // [{id, portaria, assunto, remetente, data, lida}]

function adicionarNotifMensagem(portaria, assunto, remetente, texto){
  var agora = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});

  // Registra alerta
  var alerta = { id: Date.now(), portaria: portaria, assunto: assunto, remetente: remetente, data: 'Hoje, '+agora, lida: false };
  alertasMsgs.unshift(alerta);

  // Atualiza lista na aba Notificações
  renderListaMsgsCoord();

  // Atualiza badge na nav
  atualizarBadgeMsgs();

  // Painel movimentações
  var movs = document.getElementById('painel-movimentacoes');
  if(movs){
    var div = document.createElement('div');
    div.className = 'ni';
    div.setAttribute('data-pad', portaria);
    div.innerHTML = '<div class="nic nii"><i class="ti ti-message-circle"></i></div>'
      +'<div style="flex:1">'
      +'<div class="nt">PAD '+portaria+' — mensagem de '+remetente+'</div>'
      +'<div class="ns">'+(assuntoLabels[assunto]||assunto)+'</div>'
      +'<div class="nm">Hoje, '+agora+'</div></div>'
      +'<button class="btn btn-sm" style="border-color:#222222;color:#222222"><i class="ti ti-eye"></i> Ver</button>';
    movs.insertBefore(div, movs.firstChild);
    var btn = movs.firstChild.querySelector('.btn');
    if(btn)(function(p,aid){ btn.addEventListener('click', function(e){ e.stopPropagation(); abrirVerMsg(p,aid); }); })(portaria, alerta.id);
    div.addEventListener('click', (function(p,aid){ return function(){ abrirVerMsg(p,aid); }; })(portaria, alerta.id));
  }
}

function renderListaMsgsCoord(){
  var c = document.getElementById('lista-msgs-coord');
  if(!c) return;
  if(!alertasMsgs.length){
    c.innerHTML = '<div style="font-size:12px;color:#aaa;padding:12px 0;text-align:center"><i class="ti ti-inbox" style="font-size:20px;display:block;margin-bottom:6px"></i>Nenhuma mensagem recebida ainda.</div>';
    return;
  }
  c.innerHTML = '';
  alertasMsgs.forEach(function(a){
    var div = document.createElement('div');
    div.className = 'ni';
    div.style.cssText = 'cursor:pointer;'+(a.lida?'opacity:.6':'');
    div.innerHTML = '<div class="nic '+(a.lida?'nio':'nii')+'"><i class="ti ti-message-circle"></i></div>'
      +'<div style="flex:1">'
      +'<div class="nt" style="'+(a.lida?'':'font-weight:700')+'">PAD '+a.portaria+' — '+a.remetente+'</div>'
      +'<div class="ns">'+(assuntoLabels[a.assunto]||a.assunto)+'</div>'
      +'<div class="nm">'+a.data+'</div></div>'
      +'<div style="display:flex;gap:5px;flex-shrink:0">'
      +(a.lida?'':'<span style="width:8px;height:8px;background:#E24B4A;border-radius:50%;display:inline-block;margin-top:4px;flex-shrink:0"></span>')
      +'<button class="btn btn-sm" style="border-color:#222222;color:#222222"><i class="ti ti-eye"></i> Ver</button>'
      +'</div>';
    div.addEventListener('click', (function(portaria, aid){ return function(){ abrirVerMsg(portaria, aid); }; })(a.portaria, a.id));
    var btn = div.querySelector('.btn');
    if(btn) btn.addEventListener('click', function(e){ e.stopPropagation(); abrirVerMsg(a.portaria, a.id); });
    c.appendChild(div);
  });
}

function atualizarBadgeMsgs(){
  var naoLidas = alertasMsgs.filter(function(a){ return !a.lida; }).length;
  // Badge na nav notif
  var nb = document.querySelector('#nav-notif .nb');
  if(nb){ nb.textContent = naoLidas; nb.style.display = naoLidas ? '' : 'none'; }
  // Badge no card de mensagens
  var mb = document.getElementById('msgs-badge');
  if(mb){ mb.textContent = naoLidas; mb.style.display = naoLidas ? '' : 'none'; }
}

function marcarTodasLidas(){
  alertasMsgs.forEach(function(a){ a.lida = true; });
  storageSalvarMensagens();
  renderListaMsgsCoord();
  atualizarBadgeMsgs();
}

function marcarTodasLidasAdv(){
  if(!SESSAO.id) return;
  var alertas = alertasAdv[SESSAO.id] || [];
  alertas.forEach(function(a){ a.lida = true; });
  storageSalvarMensagens();
  renderNotifAdv(SESSAO.id);
  atualizarBadgeAdv(SESSAO.id);
}

/* ===== MODAL VER MENSAGEM ===== */
var verMsgPortaria = null;

function abrirVerMsg(portaria, alertaId){
  verMsgPortaria = portaria;
  // Marca como lida
  alertasMsgs.forEach(function(a){ if(a.id === alertaId) a.lida = true; });
  storageSalvarMensagens();
  renderListaMsgsCoord();
  atualizarBadgeMsgs();

  // Preenche modal
  document.getElementById('ver-msg-pad').textContent = portaria;
  var msgs = mensagensDB[portaria] || [];
  var remetentes = [...new Set(msgs.filter(function(m){ return m.de !== 'Unidade'; }).map(function(m){ return m.de; }))];
  document.getElementById('ver-msg-remetente').textContent = remetentes.length ? remetentes.join(', ') : '';
  document.getElementById('ver-msg-resposta').value = '';

  renderHistoricoVerMsg(portaria);
  setTimeout(function(){ document.getElementById('modal-ver-msg').style.display = 'flex'; }, 10);
}

function renderHistoricoVerMsg(portaria){
  var cont = document.getElementById('ver-msg-historico');
  cont.innerHTML = '';
  var msgs = mensagensDB[portaria] || [];
  if(!msgs.length){
    cont.innerHTML = '<div style="font-size:12px;color:#aaa;text-align:center;padding:16px 0">Nenhuma mensagem ainda.</div>';
    return;
  }
  msgs.forEach(function(m){
    var isUnidade = m.de === 'Unidade';
    var div = document.createElement('div');
    div.style.cssText = 'padding:10px 13px;border-radius:10px;font-size:12px;max-width:90%;'
      +(isUnidade
        ? 'background:#F2FAF0;border:1px solid #C0DD97;align-self:flex-end;margin-left:auto'
        : 'background:#F0F0F0;border:1px solid #CCCCCC');
    div.innerHTML = '<div style="font-weight:700;margin-bottom:4px;color:'+(isUnidade?'#27500A':'#111111')+'">'
      +'<i class="ti ti-'+(isUnidade?'building':'user')+'" style="margin-right:4px;font-size:11px"></i>'
      +m.de+' <span style="font-weight:400;color:#aaa;font-size:10px;margin-left:6px">'+m.data+'</span></div>'
      +'<div style="color:#444;font-size:11px;font-weight:600;margin-bottom:3px">'+(assuntoLabels[m.assunto]||m.assunto)+'</div>'
      +'<div style="color:#333;line-height:1.5">'+m.texto+'</div>';
    cont.appendChild(div);
  });
  cont.scrollTop = cont.scrollHeight;
}

function fecharModalVerMsg(){
  document.getElementById('modal-ver-msg').style.display = 'none';
  verMsgPortaria = null;
}

/* banco de notificações para advogados: { advId: [{id, portaria, texto, data, lida}] } */
var alertasAdv = {};

function responderMensagem(){
  var texto = document.getElementById('ver-msg-resposta').value.trim();
  if(!texto){ alert('Escreva uma resposta.'); return; }
  if(!verMsgPortaria){ return; }
  if(!mensagensDB[verMsgPortaria]) mensagensDB[verMsgPortaria] = [];
  var agora = new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});
  mensagensDB[verMsgPortaria].push({ id: Date.now(), de: 'Unidade', assunto: 'resposta', texto: texto, data: agora });
  document.getElementById('ver-msg-resposta').value = '';
  renderHistoricoVerMsg(verMsgPortaria);

  // Cria notificação para os advogados com acesso a este processo
  adicionarAlertaAdv(verMsgPortaria, texto, agora);
  storageSalvarMensagens();
  mostrarToast('Resposta enviada!', 'success');
}

function adicionarAlertaAdv(portaria, texto, data){
  // Encontra todos os advogados com acesso a este processo
  advDB.forEach(function(adv){
    if(adv.pads.indexOf(portaria) < 0) return;
    if(!alertasAdv[adv.id]) alertasAdv[adv.id] = [];
    alertasAdv[adv.id].unshift({ id: Date.now()+Math.random(), portaria: portaria, texto: texto, data: data, lida: false });
  });
}

function atualizarBadgeAdv(advId){
  var alertas = alertasAdv[advId] || [];
  var naoLidas = alertas.filter(function(a){ return !a.lida; }).length;
  var nb = document.querySelector('#nav-notif .nb');
  if(nb){ nb.textContent = naoLidas; nb.style.display = naoLidas ? '' : 'none'; }
}

function renderNotifAdv(advId){
  // Chamada quando advogado abre aba Notificações
  var alertas = alertasAdv[advId] || [];
  var c = document.getElementById('lista-notif-adv');
  if(!c) return;
  if(!alertas.length){
    c.innerHTML = '<div style="font-size:12px;color:#aaa;padding:12px 0;text-align:center"><i class="ti ti-bell-off" style="font-size:20px;display:block;margin-bottom:6px"></i>Nenhuma notificação ainda.</div>';
    return;
  }
  c.innerHTML = '';
  alertas.forEach(function(a){
    var div = document.createElement('div');
    div.className = 'ni';
    div.style.cssText = 'cursor:pointer' + (a.lida ? ';opacity:.65' : '');
    div.innerHTML = '<div class="nic '+(a.lida?'nio':'nii')+'"><i class="ti ti-building"></i></div>'
      +'<div style="flex:1">'
      +'<div class="nt" style="'+(a.lida?'':'font-weight:700')+'">Resposta da unidade — PAD '+a.portaria+'</div>'
      +'<div class="ns" style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+a.texto+'</div>'
      +'<div class="nm">'+a.data+'</div></div>'
      +(a.lida?'':'<span style="width:8px;height:8px;background:#E24B4A;border-radius:50%;display:inline-block;margin-top:4px;flex-shrink:0"></span>');
    div.addEventListener('click', (function(al, aid){ return function(){
      al.lida = true;
      atualizarBadgeAdv(aid);
      renderNotifAdv(aid);
      // Abre modal de mensagem pré-selecionado no processo
      abrirModalMensagem();
      setTimeout(function(){
        var sel = document.getElementById('msg-pad');
        if(sel){ sel.value = al.portaria; renderHistoricoModal(al.portaria); }
      }, 60);
    }; })(a, advId));
    c.appendChild(div);
  });
}

function abrirRespostaMensagem(portaria){
  abrirVerMsg(portaria, null);
}

