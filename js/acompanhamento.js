/* ============================================================
   acompanhamento.js — Acompanhamento processual, timeline, etapas
   PAD Digital · Polícia Penal SC
   ============================================================ */

/* ===== MODAL JUNTADA ===== */
var juntadaArquivo = null;

function filtrarPorStatus(tipo){
  var statusMap = {
    'andamento': 'andamento',
    'defesa':    'aguarda vep',
    'critico':   'crítico',
    'concluido': 'concluído'
  };
  goTab('pads');
  setTimeout(function(){
    var fs = document.getElementById('filtro-status');
    if(fs){ fs.value = statusMap[tipo] || ''; }
    filtrarPADs();
  }, 80);
}

/* ===== DADOS DOS PADs ===== */
var padsData = {};

var padAtivo = null;  // portaria do PAD aberto
var etapaAtiva = null; // índice da etapa clicada

function abrirAcompanhamento(pad, nome, statusCls, statusTxt){
  padAtivo = pad;
  // Cria entrada se PAD novo (adicionado dinamicamente)
  if(!padsData[pad]){
    var hoje = new Date().toLocaleDateString('pt-BR');
    padsData[pad] = {
      portaria:pad, nome:nome, ipen:window.DAD&&DAD.ipen||'', art:'Art. 50, VII LEP',
      defensor:window.DAD&&DAD.defensor||'—', statusCls:statusCls, statusTxt:statusTxt,
      timeline:[{titulo:'Portaria nº '+pad+' — instauração', data:hoje, obs:window.DAD&&DAD.diretor||'', docs:[]}],
      intimacoes:[]
    };
    storageSalvarPads();
  }
  atualizarSelectPAD();
  // Sincroniza o select com o PAD aberto
  var sel = document.getElementById('acomp-select-pad');
  if(sel) sel.value = pad;
  renderAcomp();
  goTab('acomp');
}

function renderAcomp(){
  var p = padsData[padAtivo];
  if(!p){
    document.getElementById('acomp-vazio').style.display = 'block';
    document.getElementById('acomp-conteudo').style.display = 'none';
    return;
  }
  document.getElementById('acomp-vazio').style.display = 'none';
  document.getElementById('acomp-conteudo').style.display = 'block';

  // Cabeçalho
  document.getElementById('acomp-titulo').textContent = 'PAD '+p.portaria+' — '+p.nome;
  var badge = document.getElementById('acomp-badge');
  badge.className = 'sb '+p.statusCls; badge.textContent = p.statusTxt;
  document.getElementById('acomp-sub').innerHTML = p.art+'&nbsp;·&nbsp;IPEN '+p.ipen+'&nbsp;·&nbsp;Defensor: '+p.defensor;

  // Timeline — etapas fixas do PAD
  var etapasFix = [
    { chave:'portaria',       label:'Portaria' },
    { chave:'intimacao',      label:'Intimação da defesa' },
    { chave:'oitivas',        label:'Oitivas' },
    { chave:'relatorio',      label:'Relatório pós-oitiva' },
    { chave:'defesa',         label:'Defesa técnica' },
    { chave:'decisao_dir',    label:'Decisão da direção' },
    { chave:'decisao_jud',    label:'Decisão judicial',
      sub: [
        { chave:'homologado',     label:'Homologado' },
        { chave:'nao_homologado', label:'Não homologado' }
      ]
    }
  ];

  var etapas = p.etapas || {};
  var tl = document.getElementById('acomp-timeline');
  tl.innerHTML = '';

  etapasFix.forEach(function(ef){
    var concluida = !!etapas[ef.chave];
    var div = document.createElement('div');
    div.className = 'tli tli-clicavel';
    div.style.cssText = 'display:flex;align-items:flex-start;gap:10px;padding:7px 0;border-bottom:1px solid #f3f3f3;cursor:pointer';
    var bolinha = '<span style="flex-shrink:0;width:14px;height:14px;border-radius:50%;margin-top:2px;'
      +(concluida ? 'background:#3B6D11;border:2px solid #3B6D11;' : 'background:#fff;border:2px solid #bbb;')+'display:inline-block"></span>';
    var info = '';
    if(concluida && etapas[ef.chave].data) info += '<span style="font-size:11px;color:#777;margin-left:6px">'+etapas[ef.chave].data+'</span>';
    if(concluida && etapas[ef.chave].obs)  info += '<span style="font-size:11px;color:#999;margin-left:4px">— '+etapas[ef.chave].obs+'</span>';
    var corpo = '<div><div class="tlt" style="'+(concluida?'color:#222;font-weight:600':'color:#aaa')+'">'
      +ef.label+info+'</div>';
    if(ef.sub){
      ef.sub.forEach(function(s){
        var sc = concluida && !!etapas[s.chave];
        corpo += '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;margin-left:8px">'
          +'<span style="flex-shrink:0;width:11px;height:11px;border-radius:50%;'
          +(sc ? 'background:#3B6D11;border:2px solid #3B6D11;' : 'background:#fff;border:2px solid #ccc;')+'display:inline-block"></span>'
          +'<span style="font-size:12px;color:'+(sc?'#222':'#aaa')+'">'+s.label+'</span>'
          +'</div>';
      });
    }
    corpo += '</div>';
    div.innerHTML = bolinha + corpo;
    (function(chave){ div.addEventListener('click', function(){ abrirEtapaFixa(chave); }); })(ef.chave);
    tl.appendChild(div);
  });

  // Painel lateral — comportamento diferente por perfil
  var isAdv = SESSAO.perfil === 'adv';

  // Botão registrar etapa: só coord
  document.getElementById('acomp-btn-etapa').style.display = isAdv ? 'none' : 'block';

  // Card docs: advogado vê só o botão juntar (sem lista)
  var listaDocs = document.getElementById('lista-documentos');
  listaDocs.innerHTML = '';
  if(isAdv){
    document.getElementById('acomp-docs-header').querySelector('.ct').textContent = 'Juntar documento';
    document.getElementById('btn-montar-pad').style.display = 'none';
  } else {
    document.getElementById('acomp-docs-header').querySelector('.ct').textContent = 'Documentos do processo';
    document.getElementById('btn-montar-pad').style.display = '';
    // Lista todos os docs de todas as etapas
    var todosOsDocs = [];
    p.timeline.forEach(function(item){ (item.docs||[]).forEach(function(d){ todosOsDocs.push(d); }); });
    if(todosOsDocs.length === 0){
      listaDocs.innerHTML = '<div style="font-size:12px;color:#aaa;padding:4px 0">Nenhum documento juntado ainda.</div>';
    } else {
      todosOsDocs.forEach(function(doc){
        var d = document.createElement('div');
        d.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border:1px solid #e0e0e0;border-radius:7px';
        d.innerHTML = '<span style="font-size:12px"><i class="ti ti-file" style="color:#222222;margin-right:6px"></i>'+doc.nome+'</span>'
          +(doc.url?'<a href="'+doc.url+'" download="'+doc.arquivo+'" class="btn btn-sm"><i class="ti ti-download"></i> Baixar</a>':'<span style="font-size:10px;color:#aaa">sem arquivo</span>');
        listaDocs.appendChild(d);
      });
    }
  }

  // Card intimações: só coord
  document.getElementById('acomp-card-intimacoes').style.display = isAdv ? 'none' : 'block';
  var intEl = document.getElementById('acomp-intimacoes');
  intEl.innerHTML = '';
  if(p.intimacoes.length === 0){
    intEl.innerHTML = '<div style="font-size:12px;color:#aaa;padding:8px 0">Nenhuma intimação registrada.</div>';
  } else {
    p.intimacoes.forEach(function(it){
      intEl.innerHTML += '<div class="ni"><div class="nic nio"><i class="ti ti-check"></i></div>'
        +'<div><div class="nt">'+it.titulo+'</div><div class="ns">'+it.info+'</div>'
        +(it.ok?'<div class="nm" style="color:#3B6D11">'+it.ok+'</div>':'')+'</div></div>';
    });
  }

  // Timeline processual completa
  if(typeof renderTimelineCompleta === 'function'){
    renderTimelineCompleta(padAtivo, document.getElementById('acomp-historico'));
  }
}

/* ===== MODAL DOCUMENTO DA ETAPA ===== */

// Mapa: palavras-chave no título da etapa → chave do modelo
var etapaParaModelo = {
  'portaria':    'portaria',
  'instauração': 'portaria',
  'intimação':   'intimacao',
  'intimado':    'intimacao',
  'termo':       'termo',
  'oitiva':      'termo',
  'declarações': 'termo',
  'relatório conclusivo': 'relatorio',
  'relatório cd': 'relatorio',
  'ofício':      'oficio',
  'vep':         'oficio',
  'decisão':     'decisao',
  'direção':     'decisao'
};

function detectarModeloEtapa(titulo){
  var t = titulo.toLowerCase();
  var chaves = Object.keys(etapaParaModelo);
  for(var i = 0; i < chaves.length; i++){
    if(t.indexOf(chaves[i]) >= 0) return etapaParaModelo[chaves[i]];
  }
  return null;
}

// Guarda o texto gerado para a etapa ativa
var docEtapaTexto = '';
var docEtapaNome  = '';

function abrirDocEtapa(idx){
  etapaAtiva = idx;
  var p = padsData[padAtivo];
  if(!p) return;
  var item = p.timeline[idx];
  var isAdv = SESSAO.perfil === 'adv';

  document.getElementById('modal-doc-titulo').innerHTML = '<i class="ti ti-file" style="color:#222222;margin-right:7px"></i>'+item.titulo;

  // Tenta gerar o documento correspondente à fase
  var modKey = detectarModeloEtapa(item.titulo);
  var modeloWrap = document.getElementById('modal-doc-modelo-wrap');
  docEtapaTexto = '';
  docEtapaNome  = item.titulo;

  if(modKey && MODS[modKey]){
    // Usa os dados do PAD para preencher o modelo
    var dadosBackup = Object.assign({}, DAD);
    DAD.nome      = p.nome;
    DAD.ipen      = p.ipen;
    DAD.art       = p.art;
    DAD.defensor  = p.defensor;
    DAD.portaria  = p.portaria;
    DAD.diretor   = DAD.diretor || 'Beltrano dos Santos';
    var texto = MODS[modKey].gerar({
      f_pad: p.portaria, f_apen: p.nome+(p.ipen?' — '+p.ipen:''),
      f_def: p.defensor, f_nome: p.nome
    });
    docEtapaTexto = texto;
    docEtapaNome  = MODS[modKey].titulo;
    Object.assign(DAD, dadosBackup);
    document.getElementById('modal-doc-modelo-conteudo').textContent = texto;
    modeloWrap.style.display = 'block';
  } else {
    modeloWrap.style.display = 'none';
  }

  // Arquivos anexados
  var lista = document.getElementById('modal-doc-lista');
  lista.innerHTML = '';
  if(!item.docs || item.docs.length === 0){
    lista.innerHTML = '<div style="font-size:12px;color:#aaa;padding:6px 0"><i class="ti ti-paperclip-off" style="margin-right:5px"></i>Nenhum arquivo anexado ainda.</div>';
  } else {
    item.docs.forEach(function(doc){
      var d = document.createElement('div');
      d.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border:1px solid #e0e0e0;border-radius:8px;background:#fafafa';
      d.innerHTML = '<span style="font-size:12px;font-weight:500"><i class="ti ti-file" style="color:#222222;margin-right:7px"></i>'+doc.nome+'</span>'
        +(doc.url?'<a href="'+doc.url+'" download="'+doc.arquivo+'" class="btn btn-sm"><i class="ti ti-download"></i> Baixar</a>':'');
      lista.appendChild(d);
    });
  }

  // Upload: só coordenador
  document.getElementById('modal-doc-upload-wrap').style.display = isAdv ? 'none' : 'flex';
  document.getElementById('modal-doc-upload-wrap').style.flexDirection = 'column';
  document.getElementById('modal-doc-nome').value = '';

  setTimeout(function(){ document.getElementById('modal-doc-etapa').style.display = 'flex'; }, 10);
}

function copiarDocEtapa(){
  if(!docEtapaTexto) return;
  navigator.clipboard.writeText(docEtapaTexto).then(function(){
    mostrarToast('Texto copiado!', 'success');
  });
}

function imprimirDocEtapa(){
  if(!docEtapaTexto) return;
  var w = window.open('','_blank','width=800,height=900');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+docEtapaNome+'</title>'
    +'<style>body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.8;margin:2.5cm 2.5cm 2cm 3cm;white-space:pre-wrap;color:#000}</style>'
    +'</head><body>'+docEtapaTexto+'</body></html>');
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 400);
}

function baixarDocEtapa(){
  if(!docEtapaTexto) return;
  var blob = new Blob(['\ufeff'+docEtapaTexto], {type:'application/msword;charset=utf-8'});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = docEtapaNome.replace(/\s+/g,'_')+'.doc';
  a.click(); URL.revokeObjectURL(url);
}

function fecharModalDocEtapa(){
  document.getElementById('modal-doc-etapa').style.display = 'none';
  etapaAtiva = null;
}

function vincularDocEtapa(){
  var file = document.getElementById('modal-doc-file').files[0];
  var nome = document.getElementById('modal-doc-nome').value.trim() || (file ? file.name.replace(/\.[^.]+$/,'') : '');
  if(!file && !nome){ alert('Selecione um arquivo.'); return; }
  var p = padsData[padAtivo];
  if(!p || etapaAtiva === null) return;

  var doc = { nome: nome || file.name, arquivo: file ? file.name : '', url: file ? URL.createObjectURL(file) : '' };
  if(!p.timeline[etapaAtiva].docs) p.timeline[etapaAtiva].docs = [];
  p.timeline[etapaAtiva].docs.push(doc);

  document.getElementById('modal-doc-file').value = '';
  abrirDocEtapa(etapaAtiva); // re-render modal
  renderAcomp();             // atualiza ícone na timeline
  mostrarToast('Documento vinculado!', 'success');
}

/* ===== MODAL REGISTRAR ETAPA ===== */
var etapaTextos = {
  isolamento:'Isolamento preventivo aplicado', 'notificacao-seeu':'Notificação no SEEU',
  'levantamento-ipen':'Levantamento no IPEN', 'defensor-verificado':'Defensor/advogado verificado',
  'oitiva-agendada':'Oitiva agendada', 'oitiva-incidentado':'Oitiva do incidentado realizada',
  'oitiva-testemunhas':'Oitiva das testemunhas realizada', 'relatorio-elaborado':'Relatório pós-oitiva elaborado',
  'defesa-juntada':'Defesa técnica juntada', 'relatorio-cd':'Relatório conclusivo do CD',
  'decisao-direcao':'Decisão da direção', 'enviado-sgpe':'PAD enviado via SGPE',
  'homologado-vep':'Homologado pela VEP', 'atualizado-ipen':'Atualizado no IPEN', outro:''
};

function abrirEtapaFixa(chave){
  // Se for coordenador, permite marcar/desmarcar etapa
  if(SESSAO.perfil === 'adv') return;
  if(!padAtivo || !padsData[padAtivo]) return;
  var p = padsData[padAtivo];
  if(!p.etapas) p.etapas = {};

  // Mapeia chaves de sub-etapa para a etapa pai
  var paiMap = { homologado:'decisao_jud', nao_homologado:'decisao_jud' };
  var pai = paiMap[chave];

  if(pai){
    // clique num sub-item: precisa que o pai esteja marcado
    if(!p.etapas[pai]){ mostrarToast('Marque primeiro "Decisão judicial"', 'info'); return; }
  }

  if(p.etapas[chave]){
    // já concluída — desmarcar
    delete p.etapas[chave];
    // se desmarcar decisao_jud, remove sub-itens
    if(chave === 'decisao_jud'){ delete p.etapas.homologado; delete p.etapas.nao_homologado; }
    // atualiza status
    atualizarStatusPorEtapas(padAtivo);
    renderAcomp();
    mostrarToast('Etapa desmarcada.', 'info');
  } else {
    // marcar — abre mini-modal para data/obs opcional
    abrirModalMarcarEtapa(chave);
  }
}

var _etapaParaMarcar = null;
function abrirModalMarcarEtapa(chave){
  _etapaParaMarcar = chave;
  var nomeEtapa = {
    portaria:'Portaria', intimacao:'Intimação da defesa', oitivas:'Oitivas',
    relatorio:'Relatório pós-oitiva', defesa:'Defesa técnica',
    decisao_dir:'Decisão da direção', decisao_jud:'Decisão judicial',
    homologado:'Homologado', nao_homologado:'Não homologado'
  }[chave] || chave;
  document.getElementById('marcar-etapa-titulo').textContent = nomeEtapa;
  document.getElementById('marcar-etapa-data').value = new Date().toISOString().slice(0,10);
  document.getElementById('marcar-etapa-obs').value = '';
  document.getElementById('modal-marcar-etapa').style.display = 'flex';
}
function fecharModalMarcarEtapa(){
  document.getElementById('modal-marcar-etapa').style.display = 'none';
  _etapaParaMarcar = null;
}
function confirmarMarcarEtapa(){
  if(!_etapaParaMarcar || !padAtivo || !padsData[padAtivo]) return;
  var p = padsData[padAtivo];
  if(!p.etapas) p.etapas = {};
  var dataVal = document.getElementById('marcar-etapa-data').value;
  var obsVal  = document.getElementById('marcar-etapa-obs').value.trim();
  p.etapas[_etapaParaMarcar] = {
    data: dataVal ? new Date(dataVal+'T12:00:00').toLocaleDateString('pt-BR') : '',
    obs: obsVal
  };
  // atualiza status geral
  atualizarStatusPorEtapas(padAtivo);
  storageSalvarPads();
  fecharModalMarcarEtapa();
  renderAcomp();
  mostrarToast('Etapa concluída!', 'success');
}

function atualizarStatusPorEtapas(portaria){
  var p = padsData[portaria]; if(!p || !p.etapas) return;
  var e = p.etapas;
  if(e.homologado || e.nao_homologado){
    p.statusCls='sc'; p.statusTxt='Concluído'; atualizarBadgeTabela(portaria,'sc','Concluído');
  } else if(e.decisao_jud){
    p.statusCls='sw'; p.statusTxt='Aguarda VEP'; atualizarBadgeTabela(portaria,'sw','Aguarda VEP');
  } else if(e.decisao_dir){
    p.statusCls='sa'; p.statusTxt='Andamento'; atualizarBadgeTabela(portaria,'sa','Andamento');
  }
}

function abrirModalEtapa(){
  document.getElementById('etapa-data').value = new Date().toISOString().slice(0,10);
  document.getElementById('etapa-obs').value = '';
  document.getElementById('etapa-tipo').value = 'isolamento';
  setTimeout(function(){ document.getElementById('modal-etapa').style.display = 'flex'; }, 10);
}

function fecharModalEtapa(){
  document.getElementById('modal-etapa').style.display = 'none';
}

function confirmarEtapa(){
  if(!padAtivo || !padsData[padAtivo]) return;
  var tipo  = document.getElementById('etapa-tipo').value;
  var data  = document.getElementById('etapa-data').value;
  var obs   = document.getElementById('etapa-obs').value.trim();
  var titulo = tipo === 'outro' ? (obs||'Nova etapa') : etapaTextos[tipo];
  var dataFmt = data ? new Date(data+'T12:00:00').toLocaleDateString('pt-BR') : '';

  padsData[padAtivo].timeline.push({ titulo:titulo, data:dataFmt, obs: tipo==='outro'?'':obs, docs:[] });

  if(tipo === 'homologado-vep'){ padsData[padAtivo].statusCls='sc'; padsData[padAtivo].statusTxt='Concluído'; atualizarBadgeTabela(padAtivo,'sc','Concluído'); }
  else if(tipo === 'enviado-sgpe'){ padsData[padAtivo].statusCls='sw'; padsData[padAtivo].statusTxt='Aguarda VEP'; atualizarBadgeTabela(padAtivo,'sw','Aguarda VEP'); }

  storageSalvarPads();
  renderAcomp();
  fecharModalEtapa();
  mostrarToast('Etapa registrada!', 'success');
}

function atualizarBadgeTabela(portaria, cls, txt){
  document.querySelectorAll('#tabela-pads tr, #painel-prazos tr').forEach(function(tr){
    var td = tr.querySelector('td strong');
    if(td && td.textContent.trim() === portaria){
      var sb = tr.querySelector('.sb'); if(sb){ sb.className='sb '+cls; sb.textContent=txt; }
    }
  });
}


function abrirModalJuntada(){
  juntadaArquivo = null;
  var isAdv = SESSAO.perfil === 'adv';
  var sel = document.getElementById('jt_tipo');

  // Para advogados: só defesa técnica e outro documento
  if(isAdv){
    sel.innerHTML = '<option value="doc-defesa">Defesa técnica</option>'
      +'<option value="doc-outro">Outro documento</option>';
    sel.value = 'doc-defesa';
    // Esconde campos desnecessários para advogado
    document.getElementById('jt_aviso_video').style.display = 'none';
    document.getElementById('jt_dz_sub').textContent = 'PDF, DOC, DOCX';
    document.getElementById('jt_file').setAttribute('accept', '.pdf,.doc,.docx');
  } else {
    sel.innerHTML = '<option value="doc-portaria">Portaria</option>'
      +'<option value="doc-termo-apreensao">Termo de apreensão</option>'
      +'<option value="doc-termo-declaracoes">Termo de declarações</option>'
      +'<option value="doc-intimacao">Intimação</option>'
      +'<option value="doc-defesa">Defesa técnica</option>'
      +'<option value="doc-relatorio">Relatório conclusivo CD</option>'
      +'<option value="doc-oficio">Ofício à VEP</option>'
      +'<option value="doc-decisao">Decisão da direção</option>'
      +'<option value="doc-outro">Outro documento</option>'
      +'<option value="video-incidentado">Vídeo de oitiva — incidentado</option>'
      +'<option value="video-testemunhas">Vídeo de oitiva — testemunhas</option>'
      +'<option value="video-outro">Vídeo de oitiva — outro</option>';
    sel.value = 'doc-portaria';
    document.getElementById('jt_dz_sub').textContent = 'PDF, DOC, DOCX, MP4, MKV, AVI, MOV';
    document.getElementById('jt_file').setAttribute('accept', '.pdf,.doc,.docx,.mp4,.mkv,.avi,.mov,.webm');
  }

  document.getElementById('jt_desc').value = '';
  document.getElementById('jt_data').value = new Date().toISOString().slice(0,10);
  document.getElementById('jt_file').value = '';
  document.getElementById('jt_dz_icon').className = 'ti ti-file-upload';
  document.getElementById('jt_dz_icon').style.color = '#aaa';
  document.getElementById('jt_dz_title').textContent = 'Arraste ou clique para selecionar';
  document.getElementById('jt_preview_nome').style.display = 'none';
  document.getElementById('jt_btn_confirmar').disabled = true;
  document.getElementById('jt_btn_confirmar').style.opacity = '.5';
  atualizarModalJuntada();
  setTimeout(function(){
    document.getElementById('modal-juntada').style.display = 'flex';
  }, 10);
}

function fecharModalJuntada(){
  document.getElementById('modal-juntada').style.display = 'none';
  juntadaArquivo = null;
}

function atualizarModalJuntada(){
  var tipo = document.getElementById('jt_tipo').value;
  var ehVideo = tipo.startsWith('video');
  document.getElementById('jt_aviso_video').style.display = ehVideo ? 'block' : 'none';
  document.getElementById('jt_dz_sub').textContent = ehVideo
    ? 'MP4, MKV, AVI, MOV, WEBM'
    : 'PDF, DOC, DOCX';
  var accept = ehVideo ? '.mp4,.mkv,.avi,.mov,.webm' : '.pdf,.doc,.docx';
  document.getElementById('jt_file').setAttribute('accept', accept);

  // Preenche descrição automaticamente pelo tipo
  var descMap = {
    'doc-portaria':          'Portaria',
    'doc-termo-apreensao':   'Termo de apreensão',
    'doc-termo-declaracoes': 'Termo de declarações',
    'doc-intimacao':         'Intimação',
    'doc-defesa':            'Defesa técnica',
    'doc-relatorio':         'Relatório conclusivo CD',
    'doc-oficio':            'Ofício à VEP',
    'doc-decisao':           'Decisão da direção',
    'video-incidentado':     'Vídeo de oitiva — incidentado',
    'video-testemunhas':     'Vídeo de oitiva — testemunhas',
    'video-outro':           'Vídeo de oitiva',
  };
  var descEl = document.getElementById('jt_desc');
  if(descMap[tipo]) descEl.value = descMap[tipo];
  else descEl.value = '';

  validarJuntada();
}

function handleJuntadaDrop(e){
  e.preventDefault();
  var dz = document.getElementById('jt_dropzone');
  dz.style.borderColor = '#c0d0e0';
  dz.style.background = '#fafcff';
  var f = e.dataTransfer.files[0];
  if(f) handleJuntadaFile(f);
}

function handleJuntadaFile(f){
  if(!f) return;
  juntadaArquivo = f;
  document.getElementById('jt_dz_icon').className = 'ti ti-file-check';
  document.getElementById('jt_dz_icon').style.color = '#222222';
  document.getElementById('jt_dz_title').textContent = f.name;
  document.getElementById('jt_dz_sub').textContent = (f.size/1024/1024).toFixed(1)+' MB';
  // Sugere descrição se estiver vazio
  var descEl = document.getElementById('jt_desc');
  if(!descEl.value) descEl.value = f.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ');
  validarJuntada();
}

function validarJuntada(){
  var ok = juntadaArquivo !== null;
  var btn = document.getElementById('jt_btn_confirmar');
  btn.disabled = !ok;
  btn.style.opacity = ok ? '1' : '.5';
  if(ok){
    var tipo = document.getElementById('jt_tipo').value;
    var desc = document.getElementById('jt_desc').value || juntadaArquivo.name;
    var ehVideo = tipo.startsWith('video');
    document.getElementById('jt_preview_nome').style.display = 'block';
    document.getElementById('jt_preview_txt').textContent = (ehVideo ? '🎥 ' : '📄 ') + desc + ' — pronto para juntar';
  }
}

function confirmarJuntada(){
  if(!juntadaArquivo) return;
  var tipo  = document.getElementById('jt_tipo').value;
  var desc  = document.getElementById('jt_desc').value || juntadaArquivo.name;
  var data  = document.getElementById('jt_data').value;
  var ehVideo = tipo.startsWith('video');
  var dataFmt = data ? new Date(data+'T12:00:00').toLocaleDateString('pt-BR') : '';

  // Cria URL temporária do arquivo
  var url = URL.createObjectURL(juntadaArquivo);
  var nomeArq = juntadaArquivo.name;

  // Adiciona na lista de documentos
  var lista = document.getElementById('lista-documentos');
  if(lista){
    var icone = ehVideo ? 'ti-video' : 'ti-file';
    var cor   = ehVideo ? '#854F0B' : '#222222';
    var div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border:1px solid '+(ehVideo?'#F5C77E':'#e0e0e0')+';border-radius:7px;background:'+(ehVideo?'#FFFBF2':'#fff');
    if(ehVideo){
      var btnId = 'vbtn_'+Date.now();
      div.innerHTML = '<span style="font-size:12px"><i class="ti '+icone+'" style="color:'+cor+';margin-right:6px"></i>'
        +desc+(dataFmt?' <span style="color:#aaa;font-size:10px">('+dataFmt+')</span>':'')+'</span>'
        +'<button id="'+btnId+'" class="btn btn-sm" style="color:#854F0B;border-color:#F5C77E"><i class="ti ti-player-play"></i> Reproduzir</button>';
      lista.appendChild(div);
      document.getElementById(btnId).addEventListener('click', function(){ abrirPlayerVideo(url, desc, nomeArq); });
    } else {
      div.innerHTML = '<span style="font-size:12px"><i class="ti '+icone+'" style="color:'+cor+';margin-right:6px"></i>'
        +desc+(dataFmt?' <span style="color:#aaa;font-size:10px">('+dataFmt+')</span>':'')+'</span>'
        +'<a href="'+url+'" download="'+nomeArq+'" class="btn btn-sm"><i class="ti ti-download"></i> Baixar</a>';
      lista.appendChild(div);
    }
  }

  // Se for vídeo de oitiva, adiciona botão na timeline
  if(ehVideo){
    var spanId = tipo === 'video-incidentado' ? 'video-oitiva-incidentado'
               : tipo === 'video-testemunhas'  ? 'video-oitiva-testemunhas'
               : null;
    var btnHtml = '<button onclick="abrirPlayerVideo(\''+url+'\',\''+desc.replace(/'/g,"\\'")+'\')" style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:600;color:#854F0B;background:#FAEEDA;border:1px solid #F5C77E;border-radius:5px;padding:2px 8px;margin-left:6px;cursor:pointer"><i class="ti ti-player-play" style="font-size:11px"></i> Ver vídeo</button>';
    if(spanId){
      var span = document.getElementById(spanId);
      if(span) span.innerHTML = btnHtml;
    }
    if(tipo === 'video-outro'){
      var tl = document.getElementById('acomp-timeline');
      if(tl){
        var tli = document.createElement('div');
        tli.className = 'tli';
        tli.innerHTML = '<div class="tld dk"></div>'
          +'<div class="tlt">🎥 '+desc+btnHtml+'</div>'
          +'<div class="tlm">'+(dataFmt||'Hoje')+'</div>';
        var itens = tl.querySelectorAll('.tli');
        tl.insertBefore(tli, itens[itens.length-1]);
      }
    }
  } else {
    var tl = document.getElementById('acomp-timeline');
    if(tl){
      var tli = document.createElement('div');
      tli.className = 'tli';
      tli.innerHTML = '<div class="tld dk"></div>'
        +'<div class="tlt">📄 '+desc+' juntado</div>'
        +'<div class="tlm">'+(dataFmt||'Hoje')+'</div>';
      var itens = tl.querySelectorAll('.tli');
      tl.insertBefore(tli, itens[itens.length-1]);
    }
  }

  storageSalvarPads();
  fecharModalJuntada();
  mostrarToast('Documento juntado com sucesso!', 'success');
}

// Fechar modal clicando fora
document.getElementById('modal-juntada').addEventListener('click', function(e){
  if(e.target === this) fecharModalJuntada();
});


function enviarEmailIntimacao(){
  var emailEl=document.getElementById('f_email_def');
  var email=emailEl?emailEl.value.trim():'';
  if(!email){alert('Preencha o e-mail do defensor.');if(emailEl)emailEl.focus();return;}
  var preview=document.getElementById('doc-preview');
  var corpo=preview?(preview.innerText||preview.textContent||'').trim():'';
  if(!corpo){alert('Gere o documento antes de enviar.');return;}
  var pad=(document.getElementById('f_pad')||{}).value||DAD.portaria||'___';
  var apen=(document.getElementById('f_apen')||{}).value||DAD.nome||'[apenado]';
  var assunto='Intimação — PAD Nº '+pad+' — '+apen;
  var mailtoBase='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent(assunto)+'&body=';
  var corpoEnc=encodeURIComponent(corpo);
  if((mailtoBase+corpoEnc).length<=2000){
    window.location.href=mailtoBase+corpoEnc;
  } else {
    var w=window.open('','_blank','width=640,height=520,left=200,top=100');
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Enviar Intimação</title><style>body{font-family:Arial,sans-serif;padding:20px;background:#f8fafc}.card{background:#fff;border-radius:10px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,.1)}label{font-size:11px;font-weight:700;color:#555;display:block;margin:10px 0 4px;text-transform:uppercase}input,textarea{width:100%;box-sizing:border-box;border:1px solid #d0d0d0;border-radius:6px;padding:8px;font-size:12px;font-family:Arial}textarea{height:200px;resize:vertical}.btns{display:flex;gap:8px;margin-top:14px}.btn{padding:8px 14px;border-radius:7px;border:none;cursor:pointer;font-size:13px;font-weight:600}.bb{background:#2563eb;color:#fff}.bg{background:#e5e7eb;color:#374151}</style></head><body><div class="card"><h3 style="margin:0 0 4px;font-size:14px">✉️ Enviar Intimação</h3><p style="font-size:12px;color:#888;margin:0 0 10px">Clique em <b>Abrir Outlook</b> e cole o corpo (Ctrl+V).</p><label>Para</label><input value="'+email.replace(/"/g,'&quot;')+'" readonly><label>Assunto</label><input value="'+assunto.replace(/"/g,'&quot;')+'" readonly><label>Corpo (Ctrl+A, Ctrl+C para copiar)</label><textarea id="cv" onclick="this.select()">'+corpo.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</textarea><div class="btns"><button class="btn bb" onclick="wl()">Abrir Outlook</button><button class="btn bg" onclick="cp()">Copiar corpo</button><button class="btn bg" onclick="window.close()">Fechar</button></div></div><script>var _e='+JSON.stringify(email)+',_a='+JSON.stringify(assunto)+',_c='+JSON.stringify(corpo)+';function wl(){window.location.href="mailto:"+encodeURIComponent(_e)+"?subject="+encodeURIComponent(_a)+"&body="+encodeURIComponent(_c.substring(0,1500));}function cp(){navigator.clipboard.writeText(_c).then(function(){alert("Copiado! Cole no Outlook (Ctrl+V).");}).catch(function(){document.getElementById("cv").select();document.execCommand("copy");alert("Copiado!");});}document.getElementById("cv").select();<\/script></body></html>');
    w.document.close();
  }
  if(padAtivo&&padsData[padAtivo]){padsData[padAtivo].timeline.push({titulo:'Intimação enviada por e-mail',data:new Date().toLocaleDateString('pt-BR'),obs:'E-mail: '+email,docs:[]});}
  mostrarToast('Outlook aberto!','success');
}

