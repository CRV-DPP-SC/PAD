/* ============================================================
   prazos.js — Módulo de Controle de Prazos Processuais
   PAD Digital · Polícia Penal SC
   Entidade: PRAZO_PROCESSUAL (docs/modelo-de-dados.md)
   ============================================================ */

/* ===== ESTADO ===== */
var _prazoFiltroAtivo = '';

/* ===== CÁLCULO ===== */

function _parseDateBR(str) {
  if(!str) return null;
  var p = str.split('/');
  if(p.length !== 3) return null;
  var d = new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
  return isNaN(d.getTime()) ? null : d;
}

function calcularPrazo(prazo) {
  var hoje = new Date(); hoje.setHours(0,0,0,0);
  var inicio = new Date(prazo.dataInstauracao); inicio.setHours(0,0,0,0);
  var diasProrr = (prazo.prorrogacoes||[]).reduce(function(s,p){ return s+(p.diasAdicionais||0); }, 0);
  var limite = new Date(inicio);
  limite.setDate(limite.getDate() + prazo.prazoLegalDias + diasProrr);
  var dias = Math.ceil((limite - hoje) / 86400000);
  prazo.dataLimite = limite.toISOString();
  prazo.diasRestantes = dias;
  prazo.status = dias < 0 ? 'vencido' : dias === 0 ? 'critico' : dias <= 10 ? 'atencao' : 'ok';
  return prazo;
}

function inicializarPrazoPAD(portaria) {
  var pad = padsData[portaria];
  if(!pad) return null;
  if(pad.statusCls === 'sc') {
    if(!pad.prazo) pad.prazo = { status:'concluido', diasRestantes:null, dataLimite:null };
    return pad.prazo;
  }
  if(pad.prazo && pad.prazo.dataInstauracao) {
    return calcularPrazo(pad.prazo);
  }
  var dataInstauracao = null;
  if(pad.etapas && pad.etapas.portaria && pad.etapas.portaria.data) {
    var d = _parseDateBR(pad.etapas.portaria.data);
    if(d) dataInstauracao = d.toISOString();
  }
  if(!dataInstauracao) {
    var m = portaria.match(/\/(\d{4})$/);
    if(m) {
      dataInstauracao = new Date(parseInt(m[1]), 0, 1).toISOString();
    } else {
      return null;
    }
  }
  pad.prazo = {
    id: 'pz-' + portaria.replace('/', '-'),
    pad: portaria,
    dataInstauracao: dataInstauracao,
    prazoLegalDias: 30,
    prorrogacoes: [],
    dataLimite: null,
    diasRestantes: null,
    status: null,
    alertas: []
  };
  return calcularPrazo(pad.prazo);
}

function recalcularTodosPrazos() {
  if(typeof padsData === 'undefined') return;
  Object.keys(padsData).forEach(function(portaria){
    var pad = padsData[portaria];
    if(pad.statusCls === 'sc') {
      if(!pad.prazo) pad.prazo = { status:'concluido', diasRestantes:null, dataLimite:null };
      return;
    }
    if(pad.prazo && pad.prazo.dataInstauracao) {
      calcularPrazo(pad.prazo);
    } else {
      inicializarPrazoPAD(portaria);
    }
  });
}

/* ===== HELPERS DE STATUS ===== */

function prazoStatusLabel(s) {
  return { ok:'Regular', atencao:'Atenção', critico:'Crítico', vencido:'Vencido', concluido:'Concluído' }[s] || '—';
}
function prazoStatusCls(s) {
  return { ok:'pz-ok', atencao:'pz-at', critico:'pz-cr', vencido:'pz-vn', concluido:'pz-cl' }[s] || '';
}
function prazoStatusIcon(s) {
  return { ok:'🟢', atencao:'🟡', critico:'🔴', vencido:'⚫', concluido:'✅' }[s] || '—';
}
function _fmtLimite(iso) {
  if(!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit'});
}

/* ===== DASHBOARD DE PRAZOS ===== */

function renderDashboardPrazos() {
  var el = document.getElementById('dashboard-prazos');
  if(!el) return;
  var c = { ok:0, atencao:0, critico:0, vencido:0, concluido:0, total:0 };
  if(typeof padsData !== 'undefined') {
    Object.keys(padsData).forEach(function(p){
      c.total++;
      var s = padsData[p].prazo ? (padsData[p].prazo.status||'ok') : 'ok';
      if(c[s] !== undefined) c[s]++;
    });
  }
  el.innerHTML =
    '<div class="pz-dash-grid">' +
    _pzCard('', 'ti ti-files', c.total, 'Total de PADs', 'pz-card-total') +
    _pzCard('ok',      null, c.ok,       'Regulares',  'pz-card-ok', '🟢') +
    _pzCard('atencao', null, c.atencao,  'Atenção',    'pz-card-at', '🟡') +
    _pzCard('critico', null, c.critico,  'Críticos',   'pz-card-cr', '🔴') +
    _pzCard('vencido', null, c.vencido,  'Vencidos',   'pz-card-vn', '⚫') +
    '</div>';
}

function _pzCard(status, icon, val, lbl, cls, emoji) {
  var ic = icon
    ? '<i class="' + icon + '" style="font-size:20px;color:#888"></i>'
    : '<span style="font-size:20px">' + (emoji||'') + '</span>';
  return '<div class="pz-card ' + cls + '" onclick="filtrarPADsPorPrazo(\'' + status + '\')" title="Filtrar: ' + lbl + '">' +
    '<div class="pz-ic">' + ic + '</div>' +
    '<div class="pz-val">' + val + '</div>' +
    '<div class="pz-lbl">' + lbl + '</div>' +
    '</div>';
}

/* ===== PRÓXIMOS VENCIMENTOS ===== */

function renderProximosVencimentos() {
  var el = document.getElementById('proximos-vencimentos-body');
  if(!el) return;
  var lista = [];
  if(typeof padsData !== 'undefined') {
    Object.keys(padsData).forEach(function(portaria){
      var pad = padsData[portaria];
      if(pad.prazo && pad.prazo.status !== 'concluido' && pad.prazo.dataLimite) {
        lista.push({ portaria:portaria, pad:pad });
      }
    });
  }
  lista.sort(function(a,b){
    var ar = a.pad.prazo.diasRestantes !== null ? a.pad.prazo.diasRestantes : 9999;
    var br = b.pad.prazo.diasRestantes !== null ? b.pad.prazo.diasRestantes : 9999;
    return ar - br;
  });
  if(!lista.length) {
    el.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;font-size:12px;padding:20px 0">Nenhum prazo calculado. Registre a data de instauração nas etapas do PAD.</td></tr>';
    return;
  }
  el.innerHTML = lista.map(function(item){
    var p = item.pad.prazo;
    var dias = p.diasRestantes;
    var diasTxt = dias < 0 ? Math.abs(dias)+'d vencido' : dias === 0 ? 'HOJE' : dias+' dias';
    var diasColor = p.status==='ok'?'#3B6D11':p.status==='atencao'?'#BA7517':p.status==='vencido'?'#555':'#A32D2D';
    return '<tr class="tr-link" onclick="abrirAcompanhamento(\''+item.portaria+'\',\''+item.pad.nome.replace(/'/g,'&#39;')+'\',\''+item.pad.statusCls+'\',\''+item.pad.statusTxt+'\')">' +
      '<td><strong>'+item.portaria+'</strong></td>' +
      '<td>'+item.pad.nome+'</td>' +
      '<td>'+prazoStatusIcon(p.status)+' <span class="pz-badge '+prazoStatusCls(p.status)+'">'+prazoStatusLabel(p.status)+'</span></td>' +
      '<td>'+_fmtLimite(p.dataLimite)+'</td>' +
      '<td style="font-weight:700;color:'+diasColor+'">'+diasTxt+'</td>' +
      '<td><button class="btn btn-sm" onclick="event.stopPropagation();abrirHistoricoProrrogacoes(\''+item.portaria+'\')" title="Prorrogações"><i class="ti ti-calendar-plus"></i></button></td>' +
      '</tr>';
  }).join('');
}

/* ===== FILTRO NA TELA DE PADs ===== */

function filtrarPADsPorPrazo(status) {
  _prazoFiltroAtivo = status;
  document.querySelectorAll('.pz-filtro-btn').forEach(function(btn){
    btn.classList.toggle('on', btn.getAttribute('data-pz-status') === status);
  });
  goTab('pads');
  filtrarPADs();
}

/* ===== TABELA DE PADs — COLUNA PRAZO ===== */

function renderPrazoCelula(p) {
  if(!p || p.status==='concluido') return '<div style="color:#aaa;font-size:11px">Concluído</div>';
  if(!p.dataLimite) return '<div style="color:#aaa;font-size:11px">—</div>';
  var pct = p.status==='vencido' ? 100 : Math.min(100,Math.max(0,Math.round((1-p.diasRestantes/(p.prazoLegalDias||30))*100)));
  var barCls = p.status==='ok'?'pok':p.status==='atencao'?'pwn':'pdk';
  var diasTxt = p.diasRestantes<0 ? Math.abs(p.diasRestantes)+'d venc.' : p.diasRestantes===0 ? 'HOJE' : p.diasRestantes+'d';
  return '<div style="font-size:11px">'+prazoStatusIcon(p.status)+' <span class="pz-badge '+prazoStatusCls(p.status)+'">'+prazoStatusLabel(p.status)+'</span></div>' +
    '<div style="font-size:10px;color:#666;margin-top:2px">'+_fmtLimite(p.dataLimite)+' ('+diasTxt+')</div>' +
    '<div class="pb" style="margin-top:3px"><div class="pf '+barCls+'" style="width:'+pct+'%"></div></div>';
}

function atualizarTabelaPrazos() {
  var rows = document.querySelectorAll('#tabela-pads tr');
  rows.forEach(function(tr){
    var strong = tr.querySelector('td strong');
    if(!strong) return;
    var portaria = strong.textContent.trim();
    var pad = padsData[portaria];
    if(!pad) return;
    var pzStatus = pad.prazo ? (pad.prazo.status||'ok') : '';
    tr.setAttribute('data-pz-status', pzStatus);
    var cells = tr.querySelectorAll('td');
    if(cells.length >= 7) {
      cells[6].innerHTML = renderPrazoCelula(pad.prazo);
    }
  });
}

/* ===== MODAL DE PRORROGAÇÃO ===== */

var _prazoPortariaAtiva = null;

function abrirHistoricoProrrogacoes(portaria) {
  _prazoPortariaAtiva = portaria;
  var modal = document.getElementById('modal-prorrogacao');
  var titulo = document.getElementById('modal-prazo-titulo');
  var body = document.getElementById('modal-prazo-body');
  if(!modal) return;
  if(titulo) titulo.textContent = 'Prazos — PAD ' + portaria;
  _renderHistoricoProrrogacoes(portaria, body);
  modal.style.display = 'flex';
}

function fecharModalProrrogacao() {
  var modal = document.getElementById('modal-prorrogacao');
  if(modal) modal.style.display = 'none';
  _prazoPortariaAtiva = null;
}

function _renderHistoricoProrrogacoes(portaria, container) {
  var pad = padsData[portaria];
  if(!pad || !pad.prazo || !pad.prazo.dataInstauracao) {
    container.innerHTML = '<div style="color:#aaa;font-size:12px;padding:12px 0">Prazo não calculado para este PAD. Registre a data de instauração nas etapas do acompanhamento.</div>';
    return;
  }
  var p = pad.prazo;
  var html = '<div style="background:#f7f9fc;border:1px solid #e8edf3;border-radius:8px;padding:14px 16px;margin-bottom:16px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<span style="font-size:12px;font-weight:700;color:#1a1a1a">Situação atual</span>' +
    '<span class="pz-badge '+prazoStatusCls(p.status)+'">'+prazoStatusIcon(p.status)+' '+prazoStatusLabel(p.status)+'</span>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:11.5px">' +
    _pzInfo('Instauração', new Date(p.dataInstauracao).toLocaleDateString('pt-BR')) +
    _pzInfo('Prazo legal', p.prazoLegalDias+' dias') +
    _pzInfo('Vencimento', _fmtLimite(p.dataLimite)) +
    '</div>';
  if(p.diasRestantes !== null) {
    var cor = p.status==='ok'?'#3B6D11':p.status==='atencao'?'#BA7517':'#A32D2D';
    var dtxt = p.diasRestantes<0 ? Math.abs(p.diasRestantes)+' dias vencido' : p.diasRestantes===0 ? 'Vence HOJE' : p.diasRestantes+' dias restantes';
    html += '<div style="margin-top:10px;font-size:13px;font-weight:700;color:'+cor+'">'+dtxt+'</div>';
  }
  html += '</div>';
  html += '<div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-bottom:8px">Histórico de prorrogações</div>';
  if(!p.prorrogacoes || !p.prorrogacoes.length) {
    html += '<div style="color:#aaa;font-size:12px;padding:8px 0;border-bottom:1px solid #f0f0f0;margin-bottom:14px">Nenhuma prorrogação registrada.</div>';
  } else {
    html += '<div style="margin-bottom:14px">';
    p.prorrogacoes.forEach(function(pr, i){
      html += '<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #f5f5f5">' +
        '<div style="width:24px;height:24px;border-radius:50%;background:#E8EDF3;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#555;flex-shrink:0">'+(i+1)+'</div>' +
        '<div style="flex:1"><div style="font-size:12px;font-weight:600;color:#1a1a1a">+'+pr.diasAdicionais+' dias</div>' +
        '<div style="font-size:11px;color:#555;margin-top:2px">'+(pr.motivo||'—')+'</div>' +
        '<div style="font-size:10px;color:#999;margin-top:2px">'+(pr.autorizadoPor||'')+(pr.dataDecreto?' — '+new Date(pr.dataDecreto).toLocaleDateString('pt-BR'):'')+'</div>' +
        '</div></div>';
    });
    html += '</div>';
  }
  html += '<div style="background:#fafafa;border:1px solid #e0e0e0;border-radius:8px;padding:14px">' +
    '<div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-bottom:10px"><i class="ti ti-calendar-plus" style="margin-right:5px;color:#222222"></i>Registrar prorrogação</div>' +
    '<div class="fg"><label>Dias adicionais</label><input type="number" id="prorr-dias" min="1" max="120" placeholder="Ex: 30" style="width:100%"></div>' +
    '<div class="fg"><label>Motivo / Justificativa legal</label><textarea id="prorr-motivo" placeholder="Ex: Complexidade da instrução — múltiplas testemunhas" style="width:100%"></textarea></div>' +
    '<div class="fg"><label>Autorizado por</label><input type="text" id="prorr-autor" placeholder="Ex: Beltrano dos Santos — Diretor" style="width:100%"></div>' +
    '<div style="display:flex;justify-content:flex-end"><button class="btn btn-primary btn-sm" onclick="salvarProrrogacao()"><i class="ti ti-check"></i> Registrar</button></div>' +
    '</div>';
  container.innerHTML = html;
}

function _pzInfo(lbl, val) {
  return '<div><div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:.3px">'+lbl+'</div><div style="font-weight:600;margin-top:2px">'+val+'</div></div>';
}

function salvarProrrogacao() {
  var portaria = _prazoPortariaAtiva;
  if(!portaria) return;
  var dias   = parseInt((document.getElementById('prorr-dias')||{}).value||'0');
  var motivo = ((document.getElementById('prorr-motivo')||{}).value||'').trim();
  var autor  = ((document.getElementById('prorr-autor')||{}).value||'').trim();
  if(!dias||dias<1){ mostrarToast('Informe o número de dias adicionais.','error'); return; }
  if(!motivo){ mostrarToast('Informe o motivo da prorrogação.','error'); return; }
  if(!autor){ mostrarToast('Informe quem autorizou a prorrogação.','error'); return; }
  var pad = padsData[portaria];
  if(!pad||!pad.prazo) return;
  pad.prazo.prorrogacoes.push({ id:'prorr-'+Date.now(), diasAdicionais:dias, dataDecreto:new Date().toISOString(), motivo:motivo, autorizadoPor:autor });
  calcularPrazo(pad.prazo);
  storageSalvarPads();
  _renderHistoricoProrrogacoes(portaria, document.getElementById('modal-prazo-body'));
  renderDashboardPrazos();
  renderProximosVencimentos();
  atualizarTabelaPrazos();
  mostrarToast('Prorrogação registrada com sucesso!','success');
}

/* ===== INIT ===== */

function prazosInit() {
  recalcularTodosPrazos();
  renderDashboardPrazos();
  renderProximosVencimentos();
  atualizarTabelaPrazos();
}

/* Monkey-patch filtrarPADs para integrar filtro de prazo sem alterar pad.js */
(function(){
  var _orig = filtrarPADs;
  filtrarPADs = function(){
    _orig();
    if(!_prazoFiltroAtivo) return;
    var visiveis = 0;
    document.querySelectorAll('#tabela-pads tr').forEach(function(tr){
      if(tr.style.display === 'none') return;
      if((tr.getAttribute('data-pz-status')||'') !== _prazoFiltroAtivo){
        tr.style.display = 'none';
      } else {
        visiveis++;
      }
    });
    var sem = document.getElementById('sem-resultado');
    if(sem) sem.style.display = visiveis===0 ? 'block' : 'none';
    var res = document.getElementById('busca-resultado');
    if(res){ res.style.display='inline'; res.textContent = visiveis+(visiveis===1?' resultado':' resultados'); }
  };
})();
