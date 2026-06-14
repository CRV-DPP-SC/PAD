/* ============================================================
   util.js — Funções utilitárias puras
   PAD Digital · Polícia Penal SC
   ============================================================ */

function copiarCelula(btn, texto){
  navigator.clipboard.writeText(texto).then(function(){
    btn.classList.add('copiado');
    btn.innerHTML='<i class="ti ti-check"></i>';
    setTimeout(function(){
      btn.classList.remove('copiado');
      btn.innerHTML='<i class="ti ti-copy"></i>';
    }, 1800);
  }).catch(function(){
    var el=document.createElement('textarea');
    el.value=texto;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    btn.classList.add('copiado');
    btn.innerHTML='<i class="ti ti-check"></i>';
    setTimeout(function(){
      btn.classList.remove('copiado');
      btn.innerHTML='<i class="ti ti-copy"></i>';
    }, 1800);
  });
}


function setField(id,v){
  var el=document.getElementById(id);
  if(el){el.value=v;el.classList.add('preenchido');}
}
function setFieldTA(id,v){
  var el=document.getElementById(id);
  if(el){el.value=v;el.classList.add('preenchido');}
}


function mostrarToast(msg, tipo){
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;'
    +'background:'+(tipo==='success'?'#3B6D11':'#A32D2D')+';color:#fff;'
    +'font-size:13px;font-weight:600;padding:11px 20px;border-radius:9px;'
    +'box-shadow:0 4px 16px rgba(0,0,0,.2);display:flex;align-items:center;gap:8px;'
    +'opacity:0;transition:opacity .3s';
  t.innerHTML = '<i class="ti ti-'+(tipo==='success'?'check':'alert-triangle')+'"></i> '+msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.style.opacity='1'; },10);
  setTimeout(function(){ t.style.opacity='0'; setTimeout(function(){ t.remove(); },400); },3500);
}

/* ===== UTILITÁRIOS ===== */
function fmtDate(s){
  if(!s)return'_____ de __________ de _____';
  try{return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});}catch(e){return s;}
}
function fmtDt(s){
  if(!s)return'___/___/____';
  try{return new Date(s+'T12:00:00').toLocaleDateString('pt-BR');}catch(e){return s;}
}
function numExt(n){
  var m={1:'um',2:'dois',3:'três',4:'quatro',5:'cinco',6:'seis',7:'sete',8:'oito',9:'nove',10:'dez',15:'quinze',20:'vinte',30:'trinta'};
  return m[parseInt(n)]||n;
}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function getVals(){
  var v={};
  document.querySelectorAll('#mod-panel input,#mod-panel select,#mod-panel textarea').forEach(function(el){if(el.id)v[el.id]=el.value;});
  return v;
}

