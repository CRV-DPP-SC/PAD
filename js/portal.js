/* ============================================================
   portal.js — Portal do Defensor
   PAD Digital · Polícia Penal SC
   ============================================================ */

function renderPortal() {
  var el = document.getElementById('portal-conteudo');
  if(!el) return;
  if(SESSAO.perfil !== 'adv' || !SESSAO.id) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:#aaa">Acesso restrito ao defensor.</div>';
    return;
  }
  var adv = advDB.find(function(a){ return a.id === SESSAO.id; });
  if(!adv) return;

  /* Coleta PADs deste defensor */
  var meusPads = (adv.pads || []).map(function(port) {
    return padsData[port];
  }).filter(Boolean);

  /* Contagem de mensagens não lidas */
  var naoLidas = 0;
  if(typeof mensagensDB !== 'undefined' && adv.pads) {
    adv.pads.forEach(function(port) {
      var msgs = mensagensDB[port] || [];
      msgs.forEach(function(m){ if(!m.lida && m.de !== SESSAO.id) naoLidas++; });
    });
  }

  var html = '';

  /* Boas-vindas */
  html += '<div class="card" style="margin-bottom:14px;background:linear-gradient(135deg,#f7f9fc 0%,#fff 100%)">' +
    '<div style="display:flex;align-items:center;gap:14px">' +
    '<div style="width:44px;height:44px;border-radius:50%;background:#222222;display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
    '<i class="ti ti-user" style="font-size:22px;color:#fff"></i></div>' +
    '<div><div style="font-size:15px;font-weight:700;color:#1a1a1a">Bem-vindo, ' + adv.nome + '</div>' +
    '<div style="font-size:12px;color:#666;margin-top:2px">' + adv.oab +
    (naoLidas > 0 ? ' &nbsp;·&nbsp; <span style="color:#A32D2D;font-weight:700"><i class="ti ti-bell"></i> '+naoLidas+' notificação'+(naoLidas>1?'ões':'')+'</span>' : '') +
    '</div></div>' +
    '<button class="btn btn-sm" style="margin-left:auto" onclick="abrirModalMensagem()"><i class="ti ti-message-circle"></i> Mensagem à unidade</button>' +
    '</div></div>';

  /* Meus processos */
  html += '<div class="ch" style="padding:0 0 10px 0;margin-bottom:14px;border-bottom:1px solid #f0f0f0">' +
    '<span class="ct"><i class="ti ti-folder-open" style="color:#222222;margin-right:5px"></i>Meus processos (' + meusPads.length + ')</span></div>';

  if(!meusPads.length) {
    html += '<div style="text-align:center;padding:32px;color:#aaa;font-size:13px">' +
      '<i class="ti ti-folder-off" style="font-size:32px;display:block;margin-bottom:10px"></i>' +
      'Nenhum processo vinculado ao seu acesso.</div>';
  } else {
    html += '<div style="display:flex;flex-direction:column;gap:10px">';
    meusPads.forEach(function(pad) {
      var pz = pad.prazo;
      var pzIcon = pz ? prazoStatusIcon(pz.status) : '';
      var pzLbl  = pz ? prazoStatusLabel(pz.status) : '';
      var pzCls  = pz ? prazoStatusCls(pz.status) : '';
      var diasTxt = pz && pz.diasRestantes !== null
        ? (pz.diasRestantes < 0 ? Math.abs(pz.diasRestantes) + 'd vencido' : pz.diasRestantes === 0 ? 'HOJE' : pz.diasRestantes + 'd restantes')
        : '';
      var diasCor = pz ? (pz.status==='ok'?'#3B6D11':pz.status==='atencao'?'#BA7517':'#A32D2D') : '#888';

      /* Docs e mensagens deste PAD */
      var totalDocs = 0;
      (pad.timeline||[]).forEach(function(t){ totalDocs += (t.docs||[]).length; });
      var msgsPad = typeof mensagensDB !== 'undefined' ? (mensagensDB[pad.portaria]||[]) : [];
      var msgsNLidas = msgsPad.filter(function(m){ return !m.lida && m.de !== SESSAO.id; }).length;

      html += '<div class="card" style="margin-bottom:0;padding:14px 16px;cursor:pointer" onclick="abrirAcompanhamento(\'' +
        pad.portaria + '\',\'' + pad.nome.replace(/'/g,"&#39;") + '\',\'' + pad.statusCls + '\',\'' + pad.statusTxt + '\')">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:180px">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
        '<strong style="font-size:13px;color:#1a1a1a">' + pad.portaria + '</strong>' +
        '<span class="sb ' + pad.statusCls + '" style="font-size:10px">' + pad.statusTxt + '</span>' +
        (msgsNLidas ? '<span style="background:#A32D2D;color:#fff;border-radius:99px;font-size:10px;padding:1px 7px;font-weight:700"><i class="ti ti-mail"></i> '+msgsNLidas+'</span>' : '') +
        '</div>' +
        '<div style="font-size:12px;color:#444;margin-bottom:3px">' + pad.nome + ' &nbsp;·&nbsp; IPEN ' + (pad.ipen||'—') + '</div>' +
        '<div style="font-size:11px;color:#888">' + (pad.art||'') + '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0">' +
        (pz && pz.status !== 'concluido'
          ? '<div style="font-size:11px;margin-bottom:3px">' + pzIcon + ' <span class="pz-badge ' + pzCls + '">' + pzLbl + '</span></div>' +
            '<div style="font-size:10px;color:' + diasCor + ';font-weight:700">' + diasTxt + '</div>' +
            (pz.dataLimite ? '<div style="font-size:10px;color:#aaa">Vence ' + new Date(pz.dataLimite).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) + '</div>' : '')
          : '<span class="pz-badge pz-cl">✅ Concluído</span>') +
        '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #f5f5f5">' +
        '<button class="btn btn-sm" onclick="event.stopPropagation();abrirAcompanhamento(\'' + pad.portaria + '\',\'' + pad.nome.replace(/'/g,"&#39;") + '\',\'' + pad.statusCls + '\',\'' + pad.statusTxt + '\')"><i class="ti ti-timeline"></i> Timeline</button>' +
        '<button class="btn btn-sm" onclick="event.stopPropagation();abrirModalJuntadaPortal(\'' + pad.portaria + '\')"><i class="ti ti-upload"></i> Juntar doc</button>' +
        '<button class="btn btn-sm" onclick="event.stopPropagation();abrirMsgPortal(\'' + pad.portaria + '\')"><i class="ti ti-message-circle"></i> Mensagem' + (msgsNLidas ? ' <span style=\'background:#A32D2D;color:#fff;border-radius:99px;font-size:9px;padding:1px 5px\'>' + msgsNLidas + '</span>' : '') + '</button>' +
        (pz && pz.status !== 'concluido' ? '<button class="btn btn-sm" onclick="event.stopPropagation();abrirHistoricoProrrogacoes(\'' + pad.portaria + '\')"><i class="ti ti-calendar-clock"></i> Prazo</button>' : '') +
        (totalDocs ? '<span style="font-size:11px;color:#888;margin-left:auto;align-self:center"><i class="ti ti-paperclip"></i> ' + totalDocs + ' doc'+(totalDocs>1?'s':'')+'</span>' : '') +
        '</div>' +
        '</div>';
    });
    html += '</div>';
  }

  el.innerHTML = html;
}

/* Helpers de acesso rápido do portal */
function abrirJuntadaPortal(portaria) {
  padAtivo = portaria;
  goTab('acomp');
  setTimeout(function(){ abrirModalJuntada(); }, 80);
}

function abrirMsgPortal(portaria) {
  abrirModalMensagem();
  setTimeout(function(){
    var sel = document.getElementById('msg-pad');
    if(sel) { sel.value = portaria; }
  }, 60);
}

function abrirModalJuntadaPortal(portaria) {
  padAtivo = portaria;
  abrirModalJuntada();
}

/* Monkey-patch goTab para chamar renderPortal ao abrir o portal */
(function(){
  var _orig = goTab;
  goTab = function(t) {
    _orig(t);
    if(t === 'portal' && typeof renderPortal === 'function') renderPortal();
  };
})();
