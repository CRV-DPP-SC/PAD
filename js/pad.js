/* ============================================================
   pad.js — Cadastro de PAD, upload, extração de dados
   PAD Digital · Polícia Penal SC
   ============================================================ */


/* ===== BASE DE PADs PARA AUTOCOMPLETE ===== */
var PADS_DB = [];

function buscarApenado(val){
  var sug = document.getElementById('nt_sugestoes');
  if(!sug) return;
  val = val.trim().toLowerCase();
  if(val.length < 2){ sug.style.display='none'; montarEmail(); return; }

  var matches = PADS_DB.filter(function(p){
    return p.nome.toLowerCase().includes(val)
        || p.ipen.includes(val)
        || p.pad.includes(val);
  });

  if(matches.length === 0){ sug.style.display='none'; montarEmail(); return; }

  sug.innerHTML = '';
  matches.forEach(function(p){
    var div = document.createElement('div');
    div.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:12px;border-bottom:1px solid #f0f0f0';
    div.innerHTML = '<strong>' + p.nome + '</strong> <span style="color:#888">&#8212; IPEN ' + p.ipen + '</span>'
      + '<div style="font-size:10px;color:#999;margin-top:2px">PAD ' + p.pad + (p.defensor ? ' &middot; ' + p.defensor : '') + '</div>';
    div.addEventListener('mouseover', function(){ this.style.background='#F0F0F0'; });
    div.addEventListener('mouseout',  function(){ this.style.background='#fff'; });
    div.addEventListener('click',     function(){ selecionarApenado(p.ipen); });
    sug.appendChild(div);
  });
  sug.style.display = 'block';
}

function selecionarApenado(ipen){
  var p = PADS_DB.find(function(x){ return x.ipen === ipen; });
  if(!p) return;

  // Fechar sugestões
  var sug = document.getElementById('nt_sugestoes');
  if(sug) sug.style.display='none';

  // Preencher campos
  setNtField('nt_apenado', p.nome + ' — ' + p.ipen);
  setNtField('nt_pad',     p.pad);
  setNtField('nt_defensor',p.defensor);
  setNtField('nt_email',   p.email);
  DAD.emailDef = p.email || '';

  // Destacar campos preenchidos automaticamente
  ['nt_pad','nt_defensor','nt_email'].forEach(function(id){
    var el = document.getElementById(id);
    if(el && el.value){
      el.style.borderColor = '#639922';
      el.style.background  = '#f4fbee';
    }
  });

  montarEmail();
}

function setNtField(id, val){
  var el = document.getElementById(id);
  if(el) el.value = val;
}

// Fechar sugestões ao clicar fora
document.addEventListener('click', function(e){
  var sug = document.getElementById('nt_sugestoes');
  var inp = document.getElementById('nt_apenado');
  if(sug && inp && !inp.contains(e.target) && !sug.contains(e.target)){
    sug.style.display='none';
  }
});

/* ===== INTIMAÇÃO POR E-MAIL ===== */
function montarEmail(){
  var pad        = document.getElementById('nt_pad').value||'';
  var apenado    = document.getElementById('nt_apenado').value||'';
  var defensor   = document.getElementById('nt_defensor').value||'';
  var email      = document.getElementById('nt_email').value||'';
  var assuntoV   = document.getElementById('nt_assunto').value||'vista';
  var dataOitiva = document.getElementById('nt_dataoitiva').value||'';
  var obs        = document.getElementById('nt_obs').value||'';
  var prev       = document.getElementById('nt_preview');
  if(!prev) return;

  var nl = '\n';
  var nomeDef = defensor || 'Senhor(a) Defensor(a)';
  var nomeApen = apenado || '[NOME / IPEN]';

  var assuntoMap = {
    vista:    'Vista dos autos e prazo para defesa - PAD ' + pad,
    oitiva:   'Designacao de oitiva - PAD ' + pad,
    resultado:'Resultado do PAD ' + pad,
    juntada:  'Juntada de documentos - PAD ' + pad
  };
  var assuntoTexto = assuntoMap[assuntoV] || 'Intimacao - PAD ' + pad;

  var corpo = 'Prezado(a) ' + nomeDef + ',' + nl + nl;

  if(assuntoV === 'vista'){
    corpo += 'Por meio desta, a Penitenciaria de Florianopolis intima Vossa Senhoria,' + nl;
    corpo += 'na qualidade de representante do apenado ' + nomeApen + ',' + nl;
    corpo += 'referente ao PAD no ' + pad + ',' + nl;
    corpo += 'para, no prazo de 10 (dez) dias uteis, apresentar DEFESA TECNICA.' + nl + nl;
    corpo += 'Os autos estao disponiveis para consulta:' + nl;
    corpo += '- Presencialmente: setor CEPEN/COD, dias uteis, das 09h as 17h;' + nl;
    corpo += '- Por e-mail: solicite copia indicando o no do PAD e sua OAB/matricula.' + nl;
  } else if(assuntoV === 'oitiva'){
    corpo += 'Por meio desta, intima Vossa Senhoria para comparecer' + nl;
    corpo += 'a OITIVA DO INCIDENTADO ' + nomeApen + ',' + nl;
    corpo += 'referente ao PAD no ' + pad + '.' + nl;
    if(dataOitiva) corpo += 'Data e horario: ' + dataOitiva + nl;
    corpo += nl + 'O nao comparecimento implicara o prosseguimento nos termos regulamentares.' + nl;
  } else if(assuntoV === 'resultado'){
    corpo += 'Comunicamos o resultado do PAD no ' + pad + ',' + nl;
    corpo += 'envolvendo o apenado ' + nomeApen + '.' + nl + nl;
    corpo += 'O processo foi encaminhado ao Juiz da Vara de Execucoes Penais.' + nl;
  } else if(assuntoV === 'juntada'){
    corpo += 'Solicitamos a juntada de documentos referentes' + nl;
    corpo += 'ao PAD no ' + pad + ', apenado ' + nomeApen + '.' + nl;
  }

  if(obs){ corpo += nl + 'Observacao: ' + obs + nl; }

  corpo += nl + 'Atenciosamente,' + nl;
  corpo += 'Penitenciaria de Florianopolis - Setor CEPEN/COD' + nl;
  corpo += 'Fone: (48) 3665-9123 | pe01cpen@pp.sc.gov.br';

  var previewTexto = 'Para: ' + (email||'[e-mail do defensor]') + nl
                   + 'Assunto: ' + assuntoTexto + nl + nl + corpo;

  prev.textContent = previewTexto;
  prev.dataset.assunto = assuntoTexto;
  prev.dataset.corpo   = corpo;
  prev.dataset.email   = email;
}


function enviarEmail(){
  var email  = (document.getElementById('nt_email')||{}).value||'';
  var prev   = document.getElementById('nt_preview');
  if(!prev) return;
  if(!email){ alert('Preencha o e-mail do defensor.'); return; }
  var assunto = encodeURIComponent(prev.dataset.assunto||'Intimação PAD');
  var corpo   = encodeURIComponent(prev.dataset.corpo||'');
  window.location.href = 'mailto:'+email+'?subject='+assunto+'&body='+corpo;
}

function copiarEmailTexto(){
  var prev = document.getElementById('nt_preview');
  if(!prev||!prev.textContent||prev.textContent.includes('Preencha')) return;
  navigator.clipboard.writeText(prev.textContent).then(function(){
    var b = event.currentTarget;
    var o = b.innerHTML;
    b.innerHTML='<i class="ti ti-check"></i> Copiado';
    setTimeout(function(){b.innerHTML=o;},1800);
  });
}


/* ===== BUSCA / FILTRO ===== */
function filtrarPADs(){
  var termo = (document.getElementById('busca-pad').value||'').toLowerCase().trim();
  var status = (document.getElementById('filtro-status').value||'').toLowerCase();
  var rows = document.querySelectorAll('#tabela-pads tr');
  var visiveis = 0;
  rows.forEach(function(row){
    var dados = (row.getAttribute('data-busca')||'').toLowerCase();
    var okTermo = !termo || dados.includes(termo);
    var okStatus = !status || dados.includes(status);
    if(okTermo && okStatus){
      row.style.display='';
      visiveis++;
    } else {
      row.style.display='none';
    }
  });
  // botão limpar
  var btnLimpar = document.getElementById('busca-limpar');
  if(btnLimpar) btnLimpar.style.display = termo ? 'block' : 'none';
  // contador
  var res = document.getElementById('busca-resultado');
  var sem = document.getElementById('sem-resultado');
  if(termo || status){
    if(res){ res.style.display='inline'; res.textContent = visiveis + (visiveis===1?' resultado':' resultados'); }
    if(sem){ sem.style.display = visiveis===0 ? 'block' : 'none'; }
  } else {
    if(res){ res.style.display='none'; }
    if(sem){ sem.style.display='none'; }
  }
}

function limparBusca(){
  var el = document.getElementById('busca-pad');
  if(el){ el.value=''; el.focus(); }
  var fs = document.getElementById('filtro-status');
  if(fs) fs.value='';
  filtrarPADs();
}



/* ===== UPLOAD ===== */
function handleDrop(e){
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('over');
  var f=e.dataTransfer.files[0];
  if(f) handleFile(f);
}

function handleFile(f){
  if(!f) return;
  var dz=document.getElementById('drop-zone');
  dz.classList.add('has-file');
  document.getElementById('dz-icon').className='ti ti-file-check dz-icon';
  document.getElementById('dz-title').textContent=f.name;
  document.getElementById('dz-sub').textContent=(f.size/1024).toFixed(0)+' KB — clique para trocar o arquivo';
  document.getElementById('prog-wrap').style.display='block';
  /* Usa readAsDataURL — retorna base64 direto, sem risco de stack overflow */
  var r=new FileReader();
  r.onload=function(ev){
    /* dataURL = "data:application/pdf;base64,XXXXXX" — pega só o base64 */
    var dataURL = ev.target.result;
    var b64 = dataURL.split(',')[1];
    OCORR_B64 = b64; OCORR_NOME = f.name;
    try{ storageSalvarOcorrencia(); }catch(e){}
    rodarExtracao(f.name, b64, f.type);
  };
  r.onerror=function(){ setStep(1,'err','Erro ao ler o arquivo'); };
  r.readAsDataURL(f);
}

function setStep(n,state,txt){
  var el=document.getElementById('st'+n);
  var tel=document.getElementById('st'+n+'-txt');
  el.className='step-ic '+(state==='run'?'s-run':state==='done'?'s-done':state==='err'?'s-err':'s-wait');
  if(txt&&tel) tel.textContent=txt;
  if(tel) tel.style.color=state==='done'?'#1a1a1a':state==='run'?'#222222':'#aaa';
}
function setProg(p,txt){
  document.getElementById('prog-fill').style.width=p+'%';
  document.getElementById('prog-pct').textContent=p+'%';
  if(txt) document.getElementById('prog-txt').textContent=txt;
}

function rodarExtracao(nome, b64, tipo){
  setStep(1,'run'); setProg(10,'Recebendo arquivo...');
  setTimeout(function(){
    setStep(1,'done','Arquivo recebido: '+nome);
    setStep(2,'run'); setProg(30,'Extraindo texto do PDF...');
    var ehPDF = (tipo==='application/pdf') || nome.toLowerCase().endsWith('.pdf');
    if(ehPDF && typeof pdfjsLib !== 'undefined'){
      extrairTextoPDFjs(b64, function(texto){
        if(texto && texto.trim().length > 50){
          setStep(2,'done','Texto extraído ('+texto.length+' caracteres)');
          setStep(3,'run'); setProg(60,'Identificando dados...');
          var dados = parsearTexto(texto);
          setTimeout(function(){ aplicarResposta(JSON.stringify(dados)); }, 400);
        } else {
          setStep(2,'err','PDF sem texto (scan/foto)');
          setStep(3,'err','Não foi possível extrair automaticamente');
          setStep(4,'err','Preencha os campos manualmente abaixo');
          setProg(100,'Preenchimento manual necessário');
        }
      });
    } else {
      setStep(2,'err','Formato não suportado');
      setProg(100,'Preencha manualmente');
    }
  },400);
}

function extrairTextoPDFjs(b64, callback){
  try {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for(var i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
    pdfjsLib.getDocument({data: bytes}).promise.then(function(pdf){
      var textoTotal = '';
      var paginas = pdf.numPages;
      var processadas = 0;
      for(var p=1; p<=paginas; p++){
        (function(num){
          pdf.getPage(num).then(function(page){
            page.getTextContent().then(function(tc){
              var lastY=null;
              tc.items.forEach(function(item){
                if(lastY!==null && Math.abs(item.transform[5]-lastY)>2){ textoTotal+='\n'; }
                textoTotal+=item.str+' '; lastY=item.transform[5];
              });
              textoTotal+='\n';
              processadas++;
              if(processadas === paginas) callback(textoTotal);
            });
          });
        })(p);
      }
    }).catch(function(){ callback(''); });
  } catch(e){ callback(''); }
}

function parsearTexto(txt){
  var d = {
    nome:'', ipen:'', data_infracao:'', local:'', agentes:'',
    descricao:'', artigo:'Art. 50, VII da LEP', defensor:'', portaria:'', diretor:''
  };

  // Nome
  var mNome = txt.match(/Nome:\s*([A-Z][A-Z\u00C0-\u00FF\s]{5,60}?)(?:\s{2,}|Situa)/);
  if(!mNome) mNome = txt.match(/Nome[:\s]+([A-Z][A-Z\u00C0-\u00FF\s]{4,60}?)(?=\s{2}|\n|Cart)/);
  if(mNome) d.nome = mNome[1].trim().replace(/\s+/g,' ');

  // IPEN
  var mIpen = txt.match(/Prontu[a\u00E1]rio:\s*(\d{5,7})/i);
  if(mIpen) d.ipen = mIpen[1];

  // Data infração
  var mData = txt.match(/DATA:\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  if(!mData) mData = txt.match(/DATA[^0-9]{0,10}(\d{2})\/(\d{2})\/(\d{4})/i);
  if(mData) d.data_infracao = mData[3]+'-'+mData[2]+'-'+mData[1];

  // Local
  var mNorte = txt.match(/Norte\s+(Dentro|Fora)[:\s]*(\d+)/i);
  if(mNorte) d.local = 'Cela '+mNorte[2]+' Norte '+mNorte[1];
  else {
    var mCela = txt.match(/[Cc]ela\s+(\d+)/);
    if(mCela) d.local = 'Cela '+mCela[1];
  }

  // Agentes
  var mAg = txt.match(/AGENTES ENVOLVIDOS:\s*([A-Z\u00C0-\u00FF][^\n]{5,150})/i);
  if(mAg) d.agentes = mAg[1].trim().replace(/\s+/g,' ');

  // Descrição
  var mDesc = txt.match(/DESCRI[CÇ][AÃ]O:\s*([\s\S]{20,3000}?)(?:OBSERVA[CÇ][AÃ]O:|DETENTOS ENVOLVIDOS:|AGENTES ENVOLVIDOS:|VOLUME DA PASTA)/i);
  if(!mDesc) mDesc = txt.match(/DESCRI[CÇ][AÃ]O:\s*([\s\S]{20,3000}?)(?:\n{2,}|$)/i);
  if(mDesc) d.descricao = mDesc[1].trim().replace(/[ \t]+/g,' ').replace(/\n+/g,' ');

  // Artigo
  if(/VII|celular|telefon|chip|smartphone/i.test(txt)) d.artigo = 'Art. 50, VII da LEP';
  else if(/I[^I]|indisciplina|desacato/i.test(txt)) d.artigo = 'Art. 50, I da LEP';

  // Portaria
  var mPort = txt.match(/Portaria[:\s]+[n\u00BA\u00B0]?\s*([\d\/]+)/i);
  if(mPort) d.portaria = mPort[1];

  return d;
}

function aplicarResposta(txt){
  setProg(85,'Organizando dados...');
  var d={};
  try{d=JSON.parse(txt.replace(/```json|```/g,'').trim());}catch(e){}
  if(d.nome) setField('m_nome',d.nome);
  if(d.ipen) setField('m_ipen',d.ipen);
  if(d.data_infracao) setField('m_data',d.data_infracao);
  if(d.local) setField('m_local',d.local);
  if(d.agentes) setField('m_agentes',d.agentes);
  if(d.descricao) setFieldTA('m_desc',d.descricao);
  if(d.artigo) setField('m_art',d.artigo);
  if(d.defensor) setField('m_def',d.defensor);
  if(d.portaria) setField('m_portaria',d.portaria);
  if(d.diretor) setField('m_diretor',d.diretor);
  syncDados();
  setTimeout(function(){
    setStep(3,'done','Dados identificados com sucesso');
    setStep(4,'run','Preenchendo modelos...');
    setProg(95,'Finalizando...');
    setTimeout(function(){
      setStep(4,'done','Todos os modelos estão prontos');
      setProg(100,'Concluído!');
      dadosCarregados=true;
    },400);
  },400);
}


/* ===== SYNC MANUAL ===== */
function syncDados(){
  DAD.nome=document.getElementById('m_nome').value;
  DAD.ipen=document.getElementById('m_ipen').value;
  DAD.data=document.getElementById('m_data').value;
  DAD.art=document.getElementById('m_art').value;
  DAD.grau=document.getElementById('m_grau').value;
  DAD.local=document.getElementById('m_local').value;
  DAD.agentes=document.getElementById('m_agentes').value;
  DAD.desc=document.getElementById('m_desc').value;
  DAD.defensor=document.getElementById('m_def').value;
  DAD.portaria=document.getElementById('m_portaria').value;
  DAD.diretor=document.getElementById('m_diretor').value||'Beltrano dos Santos';
  storageSalvarOcorrencia();
}

function gerarNumPortaria(){
  // Pega todas as portarias existentes e gera o próximo número
  var rows = document.querySelectorAll('#tabela-pads tr');
  var nums = [];
  rows.forEach(function(r){
    var td = r.querySelector('td strong');
    if(td){
      var m = td.textContent.match(/^(\d+)\//);
      if(m) nums.push(parseInt(m[1]));
    }
  });
  var ano = new Date().getFullYear();
  var proximo = nums.length > 0 ? (Math.max.apply(null, nums) + 1) : 1;
  return String(proximo).padStart(3,'0') + '/' + ano;
}

function confirmarDados(){
  syncDados();
  dadosCarregados=true;

  // Gerar número de portaria se ainda não tiver
  if(!DAD.portaria){
    DAD.portaria = gerarNumPortaria();
    var elPort = document.getElementById('m_portaria');
    if(elPort){ elPort.value = DAD.portaria; elPort.classList.add('preenchido'); }
  }

  // Adicionar novo PAD na tabela da aba PADs
  adicionarPADNaTabela();

  // Banner de dados carregados (para modelos)
  document.getElementById('dados-banner').style.display='flex';
  // Pré-seleciona o PAD nos selects de modelos e acompanhamento
  setTimeout(function(){
    var sm = document.getElementById('modelos-select-pad');
    if(sm) sm.value = DAD.portaria;
    var bannerTxt = document.getElementById('dados-banner-txt');
    if(bannerTxt) bannerTxt.textContent = 'PAD ' + DAD.portaria + ' — ' + (DAD.nome||'') + ' — dados carregados.';
  }, 100);

  // Toast de confirmação
  mostrarToast('PAD ' + DAD.portaria + ' aberto com sucesso!', 'success');

  // Limpa a aba Ocorrência para novo registro
  limparOcorrencia();

  // Vai para aba PADs e depois abre modelos
  goTab('pads');
  setTimeout(function(){
    goTab('modelos');
    setTimeout(function(){ selMod('portaria'); }, 80);
  }, 800);
}

function limparOcorrencia(){
  // Campos de texto
  ['m_nome','m_ipen','m_art','m_local','m_agentes','m_def','m_portaria'].forEach(function(id){
    var el = document.getElementById(id);
    if(el){ el.value = ''; el.classList.remove('preenchido'); }
  });
  // Data
  var dt = document.getElementById('m_data');
  if(dt){ dt.value = ''; dt.classList.remove('preenchido'); }
  // Textarea
  var desc = document.getElementById('m_desc');
  if(desc){ desc.value = ''; desc.classList.remove('preenchido'); }
  // Select grau — volta para Grave
  var grau = document.getElementById('m_grau');
  if(grau){ grau.value = 'Grave'; grau.classList.remove('preenchido'); }
  // Diretor — volta para valor padrão
  var dir = document.getElementById('m_diretor');
  if(dir){ dir.value = 'Beltrano dos Santos'; dir.classList.remove('preenchido'); }
  // Drop zone — volta ao estado inicial
  var dz = document.getElementById('dz-title');
  if(dz) dz.textContent = 'Arraste o arquivo aqui ou clique para selecionar';
  var dzSub = document.getElementById('dz-sub');
  if(dzSub) dzSub.textContent = 'PDF gerado digitalmente (SGP-e, i-PEN) ou DOC/DOCX — extração automática e gratuita';
  var dzIcon = document.getElementById('dz-icon');
  if(dzIcon){ dzIcon.className = 'ti ti-cloud-upload dz-icon'; }
  var dropZone = document.getElementById('drop-zone');
  if(dropZone) dropZone.classList.remove('has-file');
  var fileInput = document.getElementById('file-input');
  if(fileInput) fileInput.value = '';
  // Esconde barra de progresso
  var prog = document.getElementById('prog-wrap');
  if(prog) prog.style.display = 'none';
  // Mostra o card manual
  var manual = document.getElementById('manual-card');
  if(manual) manual.style.display = 'block';
  OCORR_B64=''; OCORR_NOME=''; storageSalvarOcorrencia();
}

function adicionarPADNaTabela(){
  // Verifica se já existe linha com essa portaria
  var tbody = document.getElementById('tabela-pads');
  if(!tbody) return;
  var jaExiste = false;
  tbody.querySelectorAll('tr').forEach(function(r){
    var td = r.querySelector('td strong');
    if(td && td.textContent.trim() === DAD.portaria) jaExiste = true;
  });
  if(jaExiste) return;

  var ano = new Date().getFullYear();
  var hoje = new Date();
  // Prazo padrão: 30 dias a partir de hoje
  var venc = new Date(hoje);
  venc.setDate(venc.getDate() + 30);
  var vencStr = venc.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'});

  var nome = DAD.nome || '—';
  var nomeAbrev = nome.split(' ').length > 2
    ? nome.split(' ')[0] + ' ' + nome.split(' ').slice(-1)[0]
    : nome;
  var ipen = DAD.ipen || '—';
  var art = (DAD.art||'Art. 50, VII').replace(' da LEP','');
  var def = DAD.defensor || '<span style="color:#aaa">— sem defensor</span>';
  var busca = DAD.portaria+' '+nome.toLowerCase()+' '+ipen+' andamento';

  // Registra no padsData para que o acompanhamento funcione
  if(!padsData[DAD.portaria]){
    var hoje2 = new Date().toLocaleDateString('pt-BR');
    padsData[DAD.portaria] = {
      portaria: DAD.portaria, nome: DAD.nome||'—', ipen: DAD.ipen||'—',
      art: DAD.art||'Art. 50, VII LEP', defensor: DAD.defensor||'— sem defensor',
      statusCls: 'sa', statusTxt: 'Andamento',
      timeline:[{titulo:'Portaria nº '+DAD.portaria+' — instauração', data:hoje2, obs:DAD.diretor||'', docs:[]}],
      intimacoes:[]
    };
  }

  var tr = document.createElement('tr');
  tr.setAttribute('data-busca', busca);
  tr.setAttribute('data-portaria', DAD.portaria);
  tr.className = 'tr-link';
  tr.innerHTML = ''
    +'<td><strong>'+DAD.portaria+'</strong></td>'
    +'<td><span class="cel-copia">'+nomeAbrev+'<button class="ic-copia" title="Copiar nome"><i class="ti ti-copy"></i></button></span></td>'
    +'<td><span class="cel-copia">'+ipen+'<button class="ic-copia" title="Copiar prontuário"><i class="ti ti-copy"></i></button></span></td>'
    +'<td>'+art+'</td>'
    +'<td>'+def+'</td>'
    +'<td><span class="sb sa">Andamento</span></td>'
    +'<td><div>'+vencStr+'</div><div class="pb"><div class="pf pok" style="width:5%"></div></div></td>'
    +'<td><button class="btn btn-sm"><i class="ti ti-eye"></i> Ver</button></td>';

  // Botão Ver — usa closure para capturar os valores corretos
  (function(portaria, nomeAp){
    tr.querySelector('.btn.btn-sm').addEventListener('click', function(e){
      e.stopPropagation();
      abrirAcompanhamento(portaria, nomeAp, 'sa', 'Andamento');
    });
    // Clicar na linha inteira também abre
    tr.addEventListener('click', function(){
      abrirAcompanhamento(portaria, nomeAp, 'sa', 'Andamento');
    });
    // Botões copiar
    var bts = tr.querySelectorAll('.ic-copia');
    if(bts[0]) bts[0].addEventListener('click', function(e){ e.stopPropagation(); copiarCelula(bts[0], nomeAp); });
    if(bts[1]) bts[1].addEventListener('click', function(e){ e.stopPropagation(); copiarCelula(bts[1], ipen); });
  })(DAD.portaria, nome);

  // Insere no topo da tabela
  tbody.insertBefore(tr, tbody.firstChild);
  atualizarSelectPAD();
  atualizarSelectPADModelos();

  // Atualiza tabela de prazos no painel
  var prazos = document.getElementById('painel-prazos');
  if(prazos){
    var trP = document.createElement('tr');
    trP.className = 'tr-link';
    trP.innerHTML = '<td><strong>'+DAD.portaria+'</strong></td>'
      +'<td>'+nomeAbrev+'</td>'
      +'<td><span class="sb sa">Andamento</span></td>'
      +'<td>'+vencStr+'</td>';
    (function(portaria, nomeAp){
      trP.addEventListener('click', function(){
        abrirAcompanhamento(portaria, nomeAp, 'sa', 'Andamento');
      });
    })(DAD.portaria, nome);
    prazos.insertBefore(trP, prazos.firstChild);
  }

  // Adiciona nas últimas movimentações do painel
  var movs = document.getElementById('painel-movimentacoes');
  if(movs){
    var agora = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    var div = criarItemMovimentacao(
      DAD.portaria,
      'PAD '+DAD.portaria+' — portaria instaurada',
      (DAD.nome||'Apenado')+(DAD.ipen?' — IPEN '+DAD.ipen:''),
      agora, 'nio', 'ti-file-plus'
    );
    movs.insertBefore(div, movs.firstChild);
  }

  // Atualiza contador do painel
  var mvEl = document.querySelector('.mc .mv');
  if(mvEl){ var n = parseInt(mvEl.textContent)||0; mvEl.textContent = n+1; }
  storageSalvarPads(); storageSalvarPadsDB();
}

function abrirModeloPAD(portaria){
  // Carrega os dados do PAD e vai para modelos
  dadosCarregados = true;
  document.getElementById('dados-banner').style.display='flex';
  goTab('modelos');
  setTimeout(function(){selMod('portaria');},80);
}

