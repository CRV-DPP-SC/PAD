/* ============================================================
   calendario.js — Calendário de oitivas e intimações
   PAD Digital · Polícia Penal SC
   ============================================================ */

// ═══════════════════ CALENDÁRIO ═══════════════════
var oitivas = [];
var calAno = new Date().getFullYear();
var calMes = new Date().getMonth();
var mcalAno = new Date().getFullYear();
var mcalMes = new Date().getMonth();
var mcalSel = [];
var MESES_CAL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
var DIAS_CAL  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function calNav(d){
  calMes += d;
  if(calMes < 0){ calMes = 11; calAno--; }
  if(calMes > 11){ calMes = 0; calAno++; }
  renderCal();
}

function renderCal(){
  var lbl = document.getElementById('cal-mes-label');
  if(lbl) lbl.textContent = MESES_CAL[calMes] + ' ' + calAno;
  var hdr  = document.getElementById('cal-hdr');
  var grid = document.getElementById('cal-grid');
  if(!hdr || !grid) return;
  hdr.innerHTML = '';
  DIAS_CAL.forEach(function(d){
    var el = document.createElement('div');
    el.className = 'cal-hdr-dia';
    el.textContent = d;
    hdr.appendChild(el);
  });
  grid.innerHTML = '';
  var prim  = new Date(calAno, calMes, 1).getDay();
  var total = new Date(calAno, calMes+1, 0).getDate();
  var ant   = new Date(calAno, calMes, 0).getDate();
  var hoje  = new Date();
  for(var i = prim-1; i >= 0; i--){
    var d = document.createElement('div');
    d.className = 'cal-dia outro-mes';
    d.innerHTML = '<div class="cal-num">'+(ant-i)+'</div>';
    grid.appendChild(d);
  }
  for(var dia = 1; dia <= total; dia++){
    var ds = calAno+'-'+String(calMes+1).padStart(2,'0')+'-'+String(dia).padStart(2,'0');
    var isHoje = (dia===hoje.getDate() && calMes===hoje.getMonth() && calAno===hoje.getFullYear());
    var d = document.createElement('div');
    d.className = 'cal-dia' + (isHoje ? ' hoje' : '');
    d.innerHTML = '<div class="cal-num">'+dia+'</div>';
    var evs = oitivas.filter(function(o){ return o.data === ds; })
                     .sort(function(a,b){ return a.hora.localeCompare(b.hora); });
    evs.forEach(function(o){
      var ev = document.createElement('div');
      ev.className = 'cal-ev ' + o.tipo;
      // Linha 1: Matrícula NOME - Nº PAD
      // Linha 2: Defensor (videoconf)   HORÁRIO
      // Linha 3: Observação
      var ipen_nome = (o.ipen ? o.ipen + ' ' : '') + (o.nome || '');
      var pad_ref   = o.pad ? ' - ' + o.pad : '';
      var def_video = (o.defensor || '') + (o.video ? ' (videoconf)' : '');
      var hor_obs   = o.hora + (o.obs ? '  ' + o.obs : '');
      ev.innerHTML =
          '<div style="font-weight:700;font-size:10px;line-height:1.3;white-space:normal">' + ipen_nome + pad_ref + '</div>'
        + '<div style="font-size:9.5px;line-height:1.3;margin-top:1px">' + def_video + '</div>'
        + '<div style="font-size:9px;line-height:1.3;margin-top:1px;opacity:.8">' + hor_obs + '</div>';
      ev.title = (o.ipen ? o.ipen + ' ' : '') + (o.nome || '') + ' - PAD ' + o.pad
        + (o.defensor ? '\nDefensor: ' + o.defensor : '')
        + (o.video    ? '\nVideoconferencia' : '')
        + (o.obs      ? '\nObs: ' + o.obs : '')
        + '\nHorario: ' + o.hora;
      ev.onclick = function(e){ e.stopPropagation(); abrirModalOitiva(null, o.id); };
      d.appendChild(ev);
    });
    (function(dsCapt){ d.onclick = function(){ abrirModalOitiva(dsCapt, null); }; })(ds);
    grid.appendChild(d);
  }
  var resto = (prim + total) % 7;
  if(resto > 0){
    for(var j = 1; j <= 7-resto; j++){
      var d = document.createElement('div');
      d.className = 'cal-dia outro-mes';
      d.innerHTML = '<div class="cal-num">'+j+'</div>';
      grid.appendChild(d);
    }
  }
}

function abrirModalOitiva(dataInicial, editId){
  var o = editId ? oitivas.find(function(x){ return x.id === editId; }) : null;
  document.getElementById('oit-id').value = editId || '';
  document.getElementById('modal-oitiva-titulo').innerHTML = (o ? '<i class="ti ti-calendar-edit" style="color:#2563eb;margin-right:6px"></i>Editar oitiva' : '<i class="ti ti-calendar-plus" style="color:#2563eb;margin-right:6px"></i>Nova oitiva');
  document.getElementById('btn-del-oit').style.display = o ? 'inline-flex' : 'none';
  var sel = document.getElementById('oit-pad');
  sel.innerHTML = '';
  var pads = Object.keys(padsData);
  pads.forEach(function(p){
    var opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p + (padsData[p] ? ' — '+padsData[p].nome : '');
    sel.appendChild(opt);
  });
  if(o){
    sel.value = o.pad;
    document.getElementById('oit-tipo').value     = o.tipo;
    document.getElementById('oit-data').value     = o.data;
    document.getElementById('oit-hora').value     = o.hora;
    document.getElementById('oit-ipen').value     = o.ipen || '';
    document.getElementById('oit-defensor').value = o.defensor || '';
    document.getElementById('oit-video').checked  = !!o.video;
    document.getElementById('oit-obs').value      = o.obs || '';
  } else {
    if(padAtivo) sel.value = padAtivo;
    document.getElementById('oit-tipo').value     = 'incidentado';
    document.getElementById('oit-data').value     = dataInicial || new Date().toISOString().slice(0,10);
    document.getElementById('oit-hora').value     = '09:00';
    document.getElementById('oit-ipen').value     = '';
    document.getElementById('oit-defensor').value = '';
    document.getElementById('oit-video').checked  = false;
    document.getElementById('oit-obs').value      = '';
  }
  document.getElementById('modal-oitiva').style.display = 'flex';
}

function fecharModalOitiva(){
  document.getElementById('modal-oitiva').style.display = 'none';
}

function salvarOitiva(){
  var id  = document.getElementById('oit-id').value;
  var pad = document.getElementById('oit-pad').value;
  var tip = document.getElementById('oit-tipo').value;
  var dat = document.getElementById('oit-data').value;
  var hor = document.getElementById('oit-hora').value;
  var ipn = document.getElementById('oit-ipen').value.trim();
  var def = document.getElementById('oit-defensor').value.trim();
  var vid = document.getElementById('oit-video').checked;
  var obs = document.getElementById('oit-obs').value.trim();
  if(!pad || !dat || !hor){ mostrarToast('Preencha PAD, data e horário.','error'); return; }
  var nome = padsData[pad] ? padsData[pad].nome : '';
  var obj  = { id: id||String(Date.now()), pad:pad, nome:nome, tipo:tip, data:dat, hora:hor, ipen:ipn, defensor:def, video:vid, obs:obs };
  if(id){
    var idx = oitivas.findIndex(function(x){ return x.id === id; });
    if(idx >= 0) oitivas[idx] = obj; else oitivas.push(obj);
  } else {
    oitivas.push(obj);
  }
  storageSalvarOitivas();
  fecharModalOitiva();
  renderCal();
  mostrarToast('Oitiva salva!','success');
}

function deletarOitiva(){
  var id = document.getElementById('oit-id').value;
  if(!id || !confirm('Excluir esta oitiva?')) return;
  oitivas = oitivas.filter(function(x){ return x.id !== id; });
  storageSalvarOitivas();
  fecharModalOitiva();
  renderCal();
  mostrarToast('Oitiva excluída.','success');
}

// ── mini-calendário intimação ──
function abrirCalIntimacao(){
  mcalSel = [];
  mcalAno = new Date().getFullYear();
  mcalMes = new Date().getMonth();
  renderMcal();
  document.getElementById('modal-cal-intim').style.display = 'flex';
}

function fecharCalIntimacao(){
  document.getElementById('modal-cal-intim').style.display = 'none';
}

function mcalNav(d){
  mcalMes += d;
  if(mcalMes < 0){ mcalMes = 11; mcalAno--; }
  if(mcalMes > 11){ mcalMes = 0; mcalAno++; }
  renderMcal();
}

function renderMcal(){
  document.getElementById('mcal-label').textContent = MESES_CAL[mcalMes]+' '+mcalAno;
  var hdr  = document.getElementById('mcal-hdr');
  var grid = document.getElementById('mcal-grid');
  hdr.innerHTML = '';
  DIAS_CAL.forEach(function(d){
    var el = document.createElement('div');
    el.className = 'mcal-hdr-cel';
    el.textContent = d;
    hdr.appendChild(el);
  });
  grid.innerHTML = '';
  var prim  = new Date(mcalAno, mcalMes, 1).getDay();
  var total = new Date(mcalAno, mcalMes+1, 0).getDate();
  var ant   = new Date(mcalAno, mcalMes, 0).getDate();
  var hojeStr = new Date().toISOString().slice(0,10);
  for(var i = prim-1; i >= 0; i--){
    var d = document.createElement('div');
    d.className = 'mcal-dia outro-mes';
    d.textContent = ant-i;
    grid.appendChild(d);
  }
  for(var dia = 1; dia <= total; dia++){
    var ds  = mcalAno+'-'+String(mcalMes+1).padStart(2,'0')+'-'+String(dia).padStart(2,'0');
    var evs = oitivas.filter(function(o){ return o.data === ds && o.data >= hojeStr; });
    var sel = mcalSel.find(function(s){ return s.data === ds; });
    var d   = document.createElement('div');
    var cls = 'mcal-dia';
    if(sel)             cls += ' selecionada';
    else if(evs.length) cls += ' tem-oitiva';
    if(ds === hojeStr)  cls += ' hoje-m';
    d.className = cls;
    d.innerHTML = '<span>'+dia+'</span>'+(evs.length && !sel ? '<span class="mcal-badge">'+evs.length+'</span>' : '');
    if(evs.length){
      (function(dsCapt, evsCapt){
        d.onclick = function(){
          var idx = mcalSel.findIndex(function(s){ return s.data === dsCapt; });
          if(idx >= 0){
            mcalSel.splice(idx, 1);
          } else {
            if(mcalSel.length >= 3){ mostrarToast('Máximo 3 datas.','error'); return; }
            var oit = evsCapt.slice().sort(function(a,b){ return a.hora.localeCompare(b.hora); })[0];
            mcalSel.push({ data:dsCapt, hora:oit.hora, obs:oit.obs||'', pad:oit.pad });
          }
          renderMcal();
          atualizarMcalLista();
        };
      })(ds, evs);
    }
    grid.appendChild(d);
  }
  var resto = (prim+total)%7;
  if(resto > 0){
    for(var j = 1; j <= 7-resto; j++){
      var d = document.createElement('div');
      d.className = 'mcal-dia outro-mes';
      d.textContent = j;
      grid.appendChild(d);
    }
  }
  atualizarMcalLista();
}

function atualizarMcalLista(){
  document.getElementById('mcal-count').textContent = mcalSel.length+' de 3 selecionadas';
  var div = document.getElementById('mcal-sel-lista');
  div.innerHTML = '';
  mcalSel.slice().sort(function(a,b){ return (a.data+a.hora).localeCompare(b.data+b.hora); })
    .forEach(function(s, i){
      var fmt = new Date(s.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:7px 10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:7px;font-size:12px';
      var num = document.createElement('span');
      num.style.cssText = 'width:18px;height:18px;background:#2563eb;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0';
      num.textContent = i+1;
      var txt = document.createElement('span');
      txt.style.cssText = 'flex:1;text-transform:capitalize';
      txt.innerHTML = fmt+' — <b>'+s.hora+'h</b>'+(s.obs?' ('+s.obs+')':'');
      var btn = document.createElement('button');
      btn.style.cssText = 'border:none;background:none;color:#aaa;cursor:pointer;font-size:16px;line-height:1;padding:0';
      btn.innerHTML = '&times;';
      (function(data){ btn.onclick = function(){ mcalSel = mcalSel.filter(function(x){ return x.data !== data; }); renderMcal(); }; })(s.data);
      row.appendChild(num); row.appendChild(txt); row.appendChild(btn);
      div.appendChild(row);
    });
}

function inserirDatasNaIntimacao(){
  if(mcalSel.length === 0){ mostrarToast('Selecione ao menos 1 data.','error'); return; }
  var sels = mcalSel.slice().sort(function(a,b){ return (a.data+a.hora).localeCompare(b.data+b.hora); });
  var txt = '\n\nSolicitamos que V.Sa. indique a data de sua prefer\u00eancia para a realiza\u00e7\u00e3o da oitiva, dentre as seguintes op\u00e7\u00f5es dispon\u00edveis:\n\n';
  sels.forEach(function(s, i){
    var fmt = new Date(s.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
    txt += '   '+String.fromCharCode(97+i)+') '+fmt.charAt(0).toUpperCase()+fmt.slice(1)+', \u00e0s '+s.hora+'h'+(s.obs?' ('+s.obs+')':'')+';\n';
  });
  txt += '\nSolicita-se a confirma\u00e7\u00e3o da data escolhida no prazo de 48 (quarenta e oito) horas \u00fateis.';
  window._datasIntimacao = txt;
  fecharCalIntimacao();
  upd();
  mostrarToast('Datas inseridas na intima\u00e7\u00e3o!','success');
}

// hook goTab para renderizar calendário
(function(){
  var _orig = goTab;
  goTab = function(t){ _orig(t); if(t === 'calendario') renderCal(); };
})();
// ═══════════════════ FIM CALENDÁRIO ═══════════════════

