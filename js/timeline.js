/* ============================================================
   timeline.js — Linha do Tempo Processual Completa
   PAD Digital · Polícia Penal SC
   ============================================================ */

var _TL_ETAPA_LABELS = {
  portaria:        { label:'Portaria de instauração',    icon:'ti-file-plus',    cor:'#222222' },
  intimacao:       { label:'Intimação da defesa',        icon:'ti-mail',         cor:'#2563EB' },
  oitivas:         { label:'Oitivas realizadas',         icon:'ti-microphone',   cor:'#7C3AED' },
  relatorio:       { label:'Relatório pós-oitiva',       icon:'ti-report',       cor:'#D97706' },
  defesa:          { label:'Defesa técnica',             icon:'ti-shield',       cor:'#3B6D11' },
  decisao_dir:     { label:'Decisão da direção',         icon:'ti-gavel',        cor:'#A32D2D' },
  decisao_jud:     { label:'Decisão judicial',           icon:'ti-building',     cor:'#6B7280' },
  homologado:      { label:'Homologado pela VEP',        icon:'ti-circle-check', cor:'#3B6D11' },
  nao_homologado:  { label:'Não homologado',             icon:'ti-circle-x',     cor:'#A32D2D' }
};

function _tlParseDate(str) {
  if(!str) return null;
  var m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(m) { var d = new Date(m[3], m[2]-1, m[1]); return isNaN(d.getTime()) ? null : d; }
  var d2 = new Date(str);
  return isNaN(d2.getTime()) ? null : d2;
}

function _tlFmtDate(d) {
  if(!d) return '';
  return d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric'});
}

function _tlSortVal(d) {
  return d ? d.getTime() : 0;
}

function renderTimelineCompleta(portaria, container) {
  if(!container) return;
  var pad = padsData[portaria];
  if(!pad) { container.innerHTML = ''; return; }

  var eventos = [];

  /* 1 — Itens do timeline[] */
  (pad.timeline || []).forEach(function(item, idx) {
    var d = _tlParseDate(item.data);
    eventos.push({
      tipo:     'evento',
      data:     d,
      dataStr:  item.data || '',
      titulo:   item.titulo,
      obs:      item.obs || '',
      docs:     item.docs || [],
      pendente: !!item.pendente,
      idx:      idx,
      icon:     _inferIcon(item.titulo),
      cor:      _inferCor(item.titulo)
    });
  });

  /* 2 — Etapas fixas marcadas (se não duplicadas pelo timeline) */
  var etapas = pad.etapas || {};
  Object.keys(_TL_ETAPA_LABELS).forEach(function(chave) {
    var et = etapas[chave];
    if(!et || !et.data) return;
    var d = _tlParseDate(et.data);
    var cfg = _TL_ETAPA_LABELS[chave];
    var jaNaTimeline = (pad.timeline||[]).some(function(t){
      return t.titulo.toLowerCase().indexOf(cfg.label.toLowerCase().substring(0,8)) >= 0;
    });
    if(!jaNaTimeline) {
      eventos.push({
        tipo: 'etapa', data: d, dataStr: et.data,
        titulo: cfg.label, obs: et.obs || '',
        docs: [], pendente: false, idx: -1,
        icon: cfg.icon, cor: cfg.cor
      });
    }
  });

  /* 3 — Prorrogações do prazo */
  if(pad.prazo && pad.prazo.prorrogacoes) {
    pad.prazo.prorrogacoes.forEach(function(pr) {
      var d = pr.dataDecreto ? new Date(pr.dataDecreto) : null;
      eventos.push({
        tipo: 'prorrogacao', data: d, dataStr: d ? d.toLocaleDateString('pt-BR') : '',
        titulo: 'Prorrogação de prazo (+' + pr.diasAdicionais + ' dias)',
        obs: (pr.motivo ? pr.motivo + ' — ' : '') + (pr.autorizadoPor || ''),
        docs: [], pendente: false, idx: -1,
        icon: 'ti-calendar-plus', cor: '#D97706'
      });
    });
  }

  /* 4 — Oitivas do calendário */
  if(typeof oitivas !== 'undefined') {
    oitivas.forEach(function(o) {
      if(!o.pad || o.pad !== portaria) return;
      var d = o.data ? new Date(o.data + 'T' + (o.hora||'08:00')) : null;
      eventos.push({
        tipo: 'oitiva', data: d, dataStr: o.data || '',
        titulo: 'Oitiva — ' + (o.nome || 'Apenado'),
        obs: (o.hora || '') + (o.defensor ? ' · Defensor: '+o.defensor : '') + (o.video ? ' · Videoconferência' : '') + (o.obs ? ' · '+o.obs : ''),
        docs: [], pendente: d ? d > new Date() : false, idx: -1,
        icon: 'ti-user-circle', cor: '#2563EB'
      });
    });
  }

  /* Ordena cronologicamente (mais antigo → mais recente); sem data → pendentes ficam por último */
  eventos.sort(function(a, b) {
    var av = a.data ? a.data.getTime() : (a.pendente ? Infinity : 0);
    var bv = b.data ? b.data.getTime() : (b.pendente ? Infinity : 0);
    return av - bv;
  });

  if(!eventos.length) {
    container.innerHTML = '<div style="color:#aaa;font-size:12px;padding:10px 0">Nenhum evento registrado.</div>';
    return;
  }

  var html = '<div class="tl-completa">';
  eventos.forEach(function(ev, i) {
    var isLast = i === eventos.length - 1;
    var bgCor = ev.pendente ? '#FFF8E1' : (ev.tipo==='prorrogacao' ? '#FAEEDA' : '#fff');
    var bordaCor = ev.pendente ? '#F59E0B' : (ev.tipo==='prorrogacao' ? '#D97706' : '#e8edf3');
    html += '<div class="tlc-item' + (ev.pendente ? ' tlc-pendente' : '') + '">' +
      '<div class="tlc-linha">' +
        '<div class="tlc-dot" style="background:' + (ev.pendente ? '#F59E0B' : ev.cor) + ';border-color:' + (ev.pendente ? '#F59E0B' : ev.cor) + '">' +
          '<i class="ti ' + ev.icon + '" style="font-size:9px;color:#fff"></i>' +
        '</div>' +
        (isLast ? '' : '<div class="tlc-vert"></div>') +
      '</div>' +
      '<div class="tlc-body" style="background:' + bgCor + ';border-color:' + bordaCor + '">' +
        '<div class="tlc-header">' +
          '<span class="tlc-titulo">' + ev.titulo + '</span>' +
          (ev.pendente ? '<span class="tlc-badge-pend">Pendente</span>' : '') +
          (ev.tipo === 'prorrogacao' ? '<span class="tlc-badge-prorr">Prorrogação</span>' : '') +
          (ev.dataStr ? '<span class="tlc-data">' + ev.dataStr + '</span>' : '') +
        '</div>' +
        (ev.obs ? '<div class="tlc-obs">' + ev.obs + '</div>' : '') +
        (ev.docs && ev.docs.length ? '<div class="tlc-docs"><i class="ti ti-paperclip"></i> ' + ev.docs.length + ' doc' + (ev.docs.length > 1 ? 's' : '') + ' anexado' + (ev.docs.length > 1 ? 's' : '') +
          (ev.idx >= 0 ? ' <button class="btn btn-sm" style="font-size:10px;padding:2px 7px" onclick="abrirDocEtapa(' + ev.idx + ')">Ver</button>' : '') +
          '</div>' : '') +
      '</div>' +
    '</div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

function _inferIcon(titulo) {
  var t = (titulo||'').toLowerCase();
  if(t.includes('portaria') || t.includes('instauração')) return 'ti-file-plus';
  if(t.includes('intimação') || t.includes('intimado'))   return 'ti-mail';
  if(t.includes('oitiva') || t.includes('declarações'))   return 'ti-microphone';
  if(t.includes('defesa') || t.includes('advogado'))      return 'ti-shield';
  if(t.includes('relatório') || t.includes('conclusiv'))  return 'ti-report';
  if(t.includes('decisão') || t.includes('direção'))      return 'ti-gavel';
  if(t.includes('homologad'))                             return 'ti-circle-check';
  if(t.includes('isolamento') || t.includes('preventivo'))return 'ti-lock';
  if(t.includes('sgpe') || t.includes('enviado'))         return 'ti-send';
  if(t.includes('vep') || t.includes('judicial'))         return 'ti-building';
  return 'ti-circle-dot';
}

function _inferCor(titulo) {
  var t = (titulo||'').toLowerCase();
  if(t.includes('portaria'))     return '#222222';
  if(t.includes('intimação'))    return '#2563EB';
  if(t.includes('oitiva'))       return '#7C3AED';
  if(t.includes('defesa'))       return '#3B6D11';
  if(t.includes('relatório'))    return '#D97706';
  if(t.includes('decisão'))      return '#A32D2D';
  if(t.includes('homologad'))    return '#3B6D11';
  if(t.includes('isolamento'))   return '#A32D2D';
  return '#888888';
}
