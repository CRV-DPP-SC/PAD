/* ============================================================
   acessos.js — Gestão de defensores e acessos
   PAD Digital · Polícia Penal SC
   ============================================================ */

/* ===== SENHAS ADVOGADOS ===== */
function gerarSenhaAleatoria(){
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  var s = '';
  for(var i=0;i<10;i++) s += chars.charAt(Math.floor(Math.random()*chars.length));
  return s;
}

function entrarComoAdvogado(adv){
  SESSAO.perfil = 'adv'; SESSAO.nome = adv.nome; SESSAO.id = adv.id;
  document.getElementById('tela-login').style.display = 'none';
  var b = document.getElementById('badge-perfil');
  b.textContent = adv.nome + ' — ' + adv.oab; b.className = 'badge-perfil bp-adv';
  ['nav-painel','nav-ocorrencia','nav-modelos','nav-acesso','nav-acomp','nav-calendario'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.style.display = 'none';
  });
  document.getElementById('nav-pads').style.display = '';
  document.getElementById('nav-notif').style.display = '';
  var navPortal = document.getElementById('nav-portal'); if(navPortal) navPortal.style.display = '';
  var btnTS = document.getElementById('btn-trocar-senha-adv'); if(btnTS) btnTS.style.display = '';
  atualizarBadgeAdv(SESSAO.id);
  document.querySelectorAll('#tabela-pads tr').forEach(function(tr){
    var td = tr.querySelector('td strong');
    if(!td) return;
    tr.style.display = adv.pads.indexOf(td.textContent.trim()) >= 0 ? '' : 'none';
  });
  var btnNovo = document.getElementById('btn-novo-pad');
  var btnMsg  = document.getElementById('btn-msg-unidade');
  if(btnNovo) btnNovo.style.display = 'none';
  if(btnMsg)  btnMsg.style.display  = '';
  goTab('portal');
}

function mostrarModalSenhaInicial(nome, senha){
  var m = document.createElement('div');
  m.id = 'modal-senha-inicial';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center';
  m.innerHTML = '<div style="background:#fff;border-radius:14px;padding:28px 26px;max-width:380px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.18)">'
    +'<div style="font-size:15px;font-weight:800;color:#1a1a1a;margin-bottom:6px"><i class="ti ti-key" style="color:#222;margin-right:6px"></i>Acesso gerado</div>'
    +'<div style="font-size:12px;color:#555;margin-bottom:18px">Anote a senha inicial de <strong>'+nome+'</strong> e entregue ao advogado. Ela não será exibida novamente.</div>'
    +'<div style="background:#F0F0F0;border-radius:9px;padding:14px 16px;text-align:center;margin-bottom:18px">'
    +'<div style="font-size:11px;color:#888;margin-bottom:4px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Senha inicial</div>'
    +'<div id="si-senha" style="font-size:22px;font-weight:900;color:#1a1a1a;letter-spacing:3px;font-family:monospace">'+senha+'</div>'
    +'</div>'
    +'<button onclick="copiarSenhaInicial()" style="width:100%;margin-bottom:8px;padding:10px;background:#222;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer"><i class="ti ti-copy"></i> Copiar senha</button>'
    +'<button onclick="fecharModalSenhaInicial()" style="width:100%;padding:10px;background:#F0F0F0;color:#333;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Fechar</button>'
    +'</div>';
  document.body.appendChild(m);
}
function copiarSenhaInicial(){
  var s = document.getElementById('si-senha');
  if(s){ navigator.clipboard.writeText(s.textContent).catch(function(){}); mostrarToast('Senha copiada!','success'); }
}
function fecharModalSenhaInicial(){
  var m = document.getElementById('modal-senha-inicial');
  if(m) m.remove();
  mostrarToast('Advogado cadastrado!','success');
}

var _trocarSenhaAdvId = null;
var _trocarSenhaPrimeiroAcesso = false;
function abrirModalTrocarSenha(advId, primeiroAcesso){
  _trocarSenhaAdvId = advId;
  _trocarSenhaPrimeiroAcesso = !!primeiroAcesso;
  var titulo = primeiroAcesso ? 'Crie sua senha de acesso' : 'Trocar senha';
  var subtitulo = primeiroAcesso ? 'Primeiro acesso detectado. Defina uma senha pessoal para continuar.' : 'Digite sua senha atual e a nova senha desejada.';
  var m = document.createElement('div');
  m.id = 'modal-trocar-senha';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center';
  m.innerHTML = '<div style="background:#fff;border-radius:14px;padding:28px 26px;max-width:360px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.18)">'
    +'<div style="font-size:15px;font-weight:800;color:#1a1a1a;margin-bottom:6px"><i class="ti ti-lock" style="color:#222;margin-right:6px"></i>'+titulo+'</div>'
    +'<div style="font-size:12px;color:#555;margin-bottom:18px">'+subtitulo+'</div>'
    +(primeiroAcesso ? '' : '<div style="margin-bottom:12px"><label style="font-size:11px;font-weight:700;color:#555;display:block;margin-bottom:4px">Senha atual</label><input id="ts-atual" type="password" style="width:100%;font-size:13px;padding:8px 11px;border-radius:8px;border:1.5px solid #d0d0d0;box-sizing:border-box"></div>')
    +'<div style="margin-bottom:12px"><label style="font-size:11px;font-weight:700;color:#555;display:block;margin-bottom:4px">Nova senha <span style="color:#aaa;font-weight:400">(mín. 6 caracteres)</span></label><input id="ts-nova" type="password" style="width:100%;font-size:13px;padding:8px 11px;border-radius:8px;border:1.5px solid #d0d0d0;box-sizing:border-box"></div>'
    +'<div style="margin-bottom:18px"><label style="font-size:11px;font-weight:700;color:#555;display:block;margin-bottom:4px">Confirmar nova senha</label><input id="ts-confirm" type="password" style="width:100%;font-size:13px;padding:8px 11px;border-radius:8px;border:1.5px solid #d0d0d0;box-sizing:border-box"></div>'
    +'<div id="ts-erro" style="display:none;font-size:11px;color:#A32D2D;padding:7px 10px;background:#FCEBEB;border-radius:6px;margin-bottom:12px"></div>'
    +'<button onclick="confirmarTrocarSenha()" style="width:100%;padding:10px;background:#222;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:8px"><i class="ti ti-check"></i> Confirmar</button>'
    +(!primeiroAcesso ? '<button onclick="fecharModalTrocarSenha()" style="width:100%;padding:10px;background:#F0F0F0;color:#333;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Cancelar</button>' : '')
    +'</div>';
  document.body.appendChild(m);
}
function confirmarTrocarSenha(){
  var adv = advDB.find(function(a){ return a.id === _trocarSenhaAdvId; });
  if(!adv) return;
  var erroEl = document.getElementById('ts-erro');
  if(!_trocarSenhaPrimeiroAcesso){
    var atual = (document.getElementById('ts-atual').value||'').trim();
    if(atual !== adv.senha){ erroEl.textContent='Senha atual incorreta.'; erroEl.style.display='block'; return; }
  }
  var nova    = (document.getElementById('ts-nova').value||'').trim();
  var confirm = (document.getElementById('ts-confirm').value||'').trim();
  if(nova.length < 6){ erroEl.textContent='A nova senha deve ter pelo menos 6 caracteres.'; erroEl.style.display='block'; return; }
  if(nova !== confirm){ erroEl.textContent='As senhas não coincidem.'; erroEl.style.display='block'; return; }
  adv.senha = nova;
  adv.primeiroAcesso = false;
  storageSalvarAdvDB();
  fecharModalTrocarSenha();
  mostrarToast('Senha alterada com sucesso!','success');
  if(_trocarSenhaPrimeiroAcesso){ entrarComoAdvogado(adv); }
}
function fecharModalTrocarSenha(){
  var m = document.getElementById('modal-trocar-senha');
  if(m) m.remove();
  _trocarSenhaAdvId = null;
}

/* ===== CADASTRO ADVOGADOS ===== */
function cadAdvogado(){
  var nome = (document.getElementById('cad-nome').value||'').trim();
  var oab  = (document.getElementById('cad-oab').value||'').trim();
  if(!nome||!oab){ alert('Preencha nome e OAB/Instituição.'); return; }
  var pads = [];
  document.querySelectorAll('#cad-processos input:checked').forEach(function(cb){ pads.push(cb.value); });
  var senhaInicial = gerarSenhaAleatoria();
  var novoAdv = { id: 'adv'+Date.now(), nome: nome, oab: oab, pads: pads, senha: senhaInicial, primeiroAcesso: true };
  advDB.push(novoAdv);
  // Atualiza coluna Defensor nos PADs vinculados
  pads.forEach(function(portaria){ atualizarDefensorNaPAD(portaria, novoAdv.id, true); });
  document.getElementById('cad-nome').value = '';
  document.getElementById('cad-oab').value = '';
  document.querySelectorAll('#cad-processos input').forEach(function(cb){ cb.checked = false; });
  storageSalvarAdvDB();
  renderAdvogados();
  mostrarModalSenhaInicial(nome, senhaInicial);
}

function renderAdvogados(){
  var c = document.getElementById('lista-advogados');
  if(!c) return;
  if(!advDB.length){
    c.innerHTML = '<div style="font-size:12px;color:#aaa;padding:10px 0;text-align:center">Nenhum advogado cadastrado ainda.</div>';
    return;
  }
  c.innerHTML = '';
  advDB.forEach(function(a){
    var tags = a.pads.length
      ? a.pads.map(function(p){ return '<span style="font-size:10px;background:#F0F0F0;color:#222222;border-radius:5px;padding:2px 7px;font-weight:600;margin-right:3px;margin-bottom:3px;display:inline-block">'+p+'</span>'; }).join('')
      : '<span style="font-size:11px;color:#aaa;font-style:italic">Nenhum processo vinculado</span>';

    var div = document.createElement('div');
    div.style.cssText = 'padding:12px 14px;border:1px solid #e0e0e0;border-radius:10px;margin-bottom:10px;background:#fafafa';

    // Header com nome + botões
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px';
    header.innerHTML = '<div>'
      +'<div style="font-size:13px;font-weight:700;color:#1a1a1a">'+a.nome+'</div>'
      +'<div style="font-size:11px;color:#888;margin-top:2px">'+a.oab+'</div>'
      +'</div>';

    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:6px;flex-shrink:0;margin-left:10px';

    var btnVinc = document.createElement('button');
    btnVinc.className = 'btn btn-sm';
    btnVinc.style.cssText = 'border-color:#222222;color:#222222';
    btnVinc.innerHTML = '<i class="ti ti-link"></i> Vincular processos';
    btnVinc.addEventListener('click', (function(aid){ return function(){ abrirModalVincular(aid); }; })(a.id));

    var btnRem = document.createElement('button');
    btnRem.className = 'btn btn-sm btn-danger';
    btnRem.innerHTML = '<i class="ti ti-trash"></i>';
    btnRem.addEventListener('click', (function(aid){ return function(){ remAdv(aid); }; })(a.id));

    btns.appendChild(btnVinc);
    btns.appendChild(btnRem);
    header.appendChild(btns);
    div.appendChild(header);

    // Tags de processos
    var tagsDiv = document.createElement('div');
    tagsDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:3px;padding-top:6px;border-top:1px solid #f0f0f0';
    tagsDiv.innerHTML = tags;
    div.appendChild(tagsDiv);

    c.appendChild(div);
  });
}

function remAdv(id){
  if(!confirm('Remover este advogado?')) return;
  var adv = advDB.find(function(a){ return a.id === id; });
  if(adv){ adv.pads.forEach(function(portaria){ atualizarDefensorNaPAD(portaria, id, false); }); }
  advDB = advDB.filter(function(a){ return a.id !== id; });
  storageSalvarAdvDB();
  renderAdvogados();
  mostrarToast('Advogado removido.', 'success');
}

/* ===== MODAL VINCULAR PROCESSOS ===== */
var advVincularId = null;

function abrirModalVincular(advId){
  advVincularId = advId;
  var adv = advDB.find(function(a){ return a.id === advId; });
  if(!adv) return;

  document.getElementById('vinc-nome').textContent = adv.nome + ' — ' + adv.oab;

  // Monta checkboxes com todos os PADs
  var lista = document.getElementById('vinc-lista');
  lista.innerHTML = '';
  var portarias = [];
  document.querySelectorAll('#tabela-pads tr td strong').forEach(function(td){ portarias.push(td.textContent.trim()); });

  if(!portarias.length){
    lista.innerHTML = '<div style="font-size:12px;color:#aaa;padding:8px 0">Nenhum PAD cadastrado ainda.</div>';
  } else {
    portarias.forEach(function(p){
      var pad = padsData && padsData[p];
      var label = p + (pad ? ' — ' + pad.nome : '');
      var checked = adv.pads.indexOf(p) >= 0 ? 'checked' : '';
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #e0e0e0;border-radius:7px;cursor:pointer;transition:background .1s';
      row.innerHTML = '<input type="checkbox" id="vp_'+p.replace('/','_')+'" value="'+p+'" '+checked+' style="accent-color:#222222;width:15px;height:15px;cursor:pointer;flex-shrink:0">'
        +'<label for="vp_'+p.replace('/','_')+'" style="font-size:12px;cursor:pointer;flex:1;line-height:1.4">'
        +'<strong>'+p+'</strong>'+(pad?' <span style="color:#888;font-weight:400">— '+pad.nome+'</span>':'')
        +(pad?'<div style="font-size:10px;color:#aaa;margin-top:1px">'+pad.art+' · IPEN '+pad.ipen+'</div>':'')
        +'</label>';
      row.addEventListener('click', function(e){
        if(e.target.tagName !== 'INPUT'){
          var cb = row.querySelector('input');
          cb.checked = !cb.checked;
        }
        row.style.background = row.querySelector('input').checked ? '#F0F0F0' : '';
        row.style.borderColor = row.querySelector('input').checked ? '#222222' : '#e0e0e0';
      });
      // Cor inicial
      if(checked){
        row.style.background = '#F0F0F0';
        row.style.borderColor = '#222222';
      }
      lista.appendChild(row);
    });
  }

  setTimeout(function(){ document.getElementById('modal-vincular').style.display = 'flex'; }, 10);
}

function fecharModalVincular(){
  document.getElementById('modal-vincular').style.display = 'none';
  advVincularId = null;
}

function confirmarVincular(){
  var adv = advDB.find(function(a){ return a.id === advVincularId; });
  if(!adv) return;

  // Remove este advogado de todos os PADs que ele tinha antes
  var anteriores = adv.pads.slice();
  anteriores.forEach(function(portaria){
    atualizarDefensorNaPAD(portaria, adv.id, false);
  });

  var selecionados = [];
  document.querySelectorAll('#vinc-lista input[type=checkbox]:checked').forEach(function(cb){
    selecionados.push(cb.value);
  });
  adv.pads = selecionados;

  // Aplica o nome do advogado nos PADs vinculados
  selecionados.forEach(function(portaria){
    atualizarDefensorNaPAD(portaria, adv.id, true);
  });

  storageSalvarAdvDB(); storageSalvarPads();
  renderAdvogados();
  fecharModalVincular();
  mostrarToast('Processos vinculados a ' + adv.nome + '!', 'success');
}

function atualizarDefensorNaPAD(portaria, advId, vincular){
  // Monta nome do defensor para este PAD (pode haver mais de um)
  var defensores = advDB.filter(function(a){
    return a.pads.indexOf(portaria) >= 0 && (vincular || a.id !== advId);
  });
  // Se estamos vinculando, inclui o advogado atual
  if(vincular){
    var advAtual = advDB.find(function(a){ return a.id === advId; });
    if(advAtual && defensores.indexOf(advAtual) < 0) defensores.push(advAtual);
  }

  var nomeDefensor = defensores.length
    ? defensores.map(function(a){ return a.nome; }).join(', ')
    : '';

  // Atualiza padsData
  if(padsData[portaria]){
    padsData[portaria].defensor = nomeDefensor || '— sem defensor';
  }

  // Atualiza célula na tabela de PADs (linhas dinâmicas e estáticas)
  document.querySelectorAll('#tabela-pads tr').forEach(function(tr){
    var tdPortaria = tr.querySelector('td strong');
    if(!tdPortaria || tdPortaria.textContent.trim() !== portaria) return;
    var tds = tr.querySelectorAll('td');
    // Coluna Defensor é a 5ª (índice 4)
    if(tds[4]){
      if(nomeDefensor){
        tds[4].textContent = nomeDefensor;
        tds[4].style.color = '';
      } else {
        tds[4].innerHTML = '<span style="color:#aaa">— sem defensor</span>';
      }
    }
  });
  // Também atualiza células estáticas marcadas com data-portaria-def
  document.querySelectorAll('td[data-portaria-def="'+portaria+'"]').forEach(function(td){
    if(nomeDefensor){
      td.textContent = nomeDefensor;
      td.style.color = '';
    } else {
      td.innerHTML = '<span style="color:#aaa">— sem defensor</span>';
    }
  });

  // Atualiza sub-linha do acompanhamento se este PAD estiver aberto
  if(padAtivo === portaria){
    var sub = document.getElementById('acomp-sub');
    if(sub && padsData[portaria]){
      var p = padsData[portaria];
      sub.innerHTML = p.art+'&nbsp;·&nbsp;IPEN '+p.ipen+'&nbsp;·&nbsp;Defensor: '+p.defensor;
    }
  }
}

function renderCadProcessos(){
  var c = document.getElementById('cad-processos');
  if(!c) return;
  c.innerHTML = '';
  var portarias = [];
  document.querySelectorAll('#tabela-pads tr td strong').forEach(function(td){ portarias.push(td.textContent.trim()); });
  if(!portarias.length){ c.innerHTML = '<span style="font-size:11px;color:#aaa">Nenhum PAD cadastrado.</span>'; return; }
  portarias.forEach(function(p){
    var id = 'cp_'+p.replace('/','_');
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 8px;border:1px solid #e0e0e0;border-radius:6px';
    row.innerHTML = '<input type="checkbox" id="'+id+'" value="'+p+'" style="accent-color:#222222;width:14px;height:14px;cursor:pointer">'
      +'<label for="'+id+'" style="font-size:12px;cursor:pointer">'+p+'</label>';
    c.appendChild(row);
  });
}
