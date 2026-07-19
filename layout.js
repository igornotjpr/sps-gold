/* Monta partes comuns de cada página a partir do registro em ferramentas.js:
   - o menu de navegação (elemento #menu-placeholder)
   - o cabeçalho eyebrow + h1 (elemento #header-title), para páginas de ferramenta
   - a grade de cartões do índice (elemento .tool-grid)
   Assim, título/eyebrow/rótulo ficam definidos em um só lugar (ferramentas.js). */

function escHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Seção de uma ferramenta no registro (agrupa o menu e o índice) — ferramentas
// sem "secao" definida caem na seção padrão do portal.
function secaoFerramenta(t){ return t.secao || 'Ferramentas SPS'; }

// Agrupa FERRAMENTAS por seção, preservando a ordem de primeira aparição
// (que já reflete o "ordem"/"ponto" definido no registro).
function ferramentasPorSecao(){
  const grupos=[];
  FERRAMENTAS.forEach(t=>{
    const nome=secaoFerramenta(t);
    let g=grupos.find(x=>x.nome===nome);
    if(!g){ g={nome,itens:[]}; grupos.push(g); }
    g.itens.push(t);
  });
  return grupos;
}

// Monta o HTML do menu de navegação (usado no cabeçalho da página e no
// header fixo miniaturizado): "Início" fica solto; cada seção vira um
// item de topo que abre um submenu (ao passar o mouse, ou por clique/toque)
// listando as ferramentas daquela seção — evita uma barra de abas longa
// e com rolagem horizontal quando há várias ferramentas.
function navHtml(cur){
  const grupos=ferramentasPorSecao();
  let h='<nav class="tab-nav">';
  h+=`<a class="tab-btn tab-btn-top ${cur==='index.html'?'active':''}" href="index.html"><span class="tab-emoji" aria-hidden="true">🏠</span>Início</a>`;
  grupos.forEach(g=>{
    const ativo=g.itens.some(t=>t.arquivo===cur);
    h+='<div class="nav-group">';
    h+=`<button type="button" class="tab-btn tab-btn-top nav-group-trigger ${ativo?'active':''}" aria-haspopup="true" aria-expanded="false">${escHtml(g.nome)}<span class="nav-caret" aria-hidden="true">▾</span></button>`;
    h+='<div class="nav-dropdown">';
    g.itens.forEach(t=>{
      const em=t.emoji?`<span class="tab-emoji" aria-hidden="true">${escHtml(t.emoji)}</span>`:'';
      h+=`<a class="nav-dropdown-item ${cur===t.arquivo?'active':''}" href="${t.arquivo}">${em}${escHtml(rotuloFerramenta(t))}</a>`;
    });
    h+='</div></div>';
  });
  h+='</nav>';
  return h;
}

// Fecha todos os submenus abertos (usado ao clicar fora, ao selecionar um
// item, ou ao pressionar Esc).
function fecharSubmenus(){
  document.querySelectorAll('.nav-group.open').forEach(g=>{
    g.classList.remove('open');
    const trig=g.querySelector('.nav-group-trigger');
    if(trig) trig.setAttribute('aria-expanded','false');
  });
}

// Alterna o submenu de uma seção por clique/toque (o :hover do CSS já cobre
// mouse; isto cobre teclado e telas sensíveis ao toque, que não têm hover).
document.addEventListener('click', e=>{
  const trigger=e.target.closest('.nav-group-trigger');
  if(trigger){
    e.preventDefault();
    const grupo=trigger.closest('.nav-group');
    const jaAberto=grupo.classList.contains('open');
    fecharSubmenus();
    if(!jaAberto){ grupo.classList.add('open'); trigger.setAttribute('aria-expanded','true'); }
    return;
  }
  if(!e.target.closest('.nav-group')) fecharSubmenus();
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape') fecharSubmenus(); });

// Monta o cabeçalho institucional padrão (logo + identificação da unidade),
// idêntico em todas as páginas — assim o header é definido em um só lugar.
// A "Seção de Processo Seletivo" agora fica como terceira linha do bloco
// tjpr-name, logo abaixo de "Secretaria de Gestão de Pessoas".
function institutionalHtml(){
  return '<div class="institutional-header">'
    +'<div class="tjpr-fallback" style="display:block;">TJPR<small>TRIBUNAL DE JUSTIÇA<br>DO ESTADO DO PARANÁ</small></div>'
    +'<div class="tjpr-name">'
    +'<strong>Tribunal de Justiça do Estado do Paraná</strong>'
    +'<span class="tjpr-line">Secretaria de Gestão de Pessoas</span>'
    +'<span class="tjpr-line">Seção de Processo Seletivo</span>'
    +'</div></div>';
}

document.addEventListener('DOMContentLoaded',()=>{
  const cur=location.pathname.split('/').pop()||'index.html';

  // 0) cabeçalho institucional padrão (mesmo em todas as páginas)
  const ih=document.getElementById('institutional-placeholder');
  if(ih){ ih.outerHTML=institutionalHtml(); }

  // 1) menu de navegação
  const p=document.getElementById('menu-placeholder');
  if(p){ p.outerHTML=navHtml(cur); }

  // 2) cabeçalho da página de ferramenta (selo de emoji + eyebrow + h1) vindo do
  //    registro; a cor de acento da ferramenta é aplicada ao cabeçalho inteiro
  //    (sombra do selo e filete inferior), ecoando o cartão da home
  const ht=document.getElementById('header-title');
  if(ht){
    const t=ferramentaPorArquivo(cur);
    if(t){
      const sheet=document.querySelector('.sheet');
      if(sheet) sheet.style.setProperty('--accent','var('+(t.cor||'--teal')+')');
      ht.outerHTML='<header class="page-header">'
        +`<span class="page-emoji" aria-hidden="true">${escHtml(t.emoji||'🛠️')}</span>`
        +'<div class="page-title-block">'
        +`<p class="eyebrow">${escHtml(t.eyebrow||'')}</p>`
        +`<h1>${escHtml(t.titulo||'')}</h1>`
        +'</div></header>';
      // manter o <title> da aba do navegador em sincronia
      document.title=(t.titulo||'Ferramenta')+' — Seção de Processo Seletivo (TJPR)';
    }
  }

  // 3) cartões do índice, agrupados por seção (registro em ferramentas.js)
  const sectionsPlaceholder=document.getElementById('tool-sections-placeholder');
  if(sectionsPlaceholder){
    const grupos=ferramentasPorSecao();
    let sh='';
    grupos.forEach((g,i)=>{
      sh+='<section class="tool-section">';
      sh+=`<h2 class="tool-section-heading">${escHtml(g.nome)}</h2>`;
      sh+='<div class="tool-grid">';
      g.itens.forEach(t=>{
        const accent=t.cor||'--teal';
        sh+=`<a class="tool-card" href="${t.arquivo}" style="--accent:var(${accent});">`
          +`<div class="tool-card-top"><span class="tool-card-emoji" aria-hidden="true">${escHtml(t.emoji||'🛠️')}</span>`
          +`<p class="tool-card-tag">${escHtml(rotuloFerramenta(t))}</p></div>`
          +`<h2>${escHtml(t.titulo)}</h2>`
          +`<p class="tool-card-desc">${escHtml(t.descricao)}</p>`
          +`</a>`;
      });
      if(i===grupos.length-1){
        sh+=`<div class="tool-card disabled" style="--accent:var(--line);">`
          +`<div class="tool-card-top"><span class="tool-card-emoji" aria-hidden="true">🚧</span>`
          +`<p class="tool-card-tag">Em breve</p></div>`
          +`<h2>Próxima ferramenta</h2>`
          +`<p class="tool-card-desc">Novas ferramentas aparecerão aqui conforme forem desenvolvidas.</p>`
          +`</div>`;
      }
      sh+='</div></section>';
    });
    sectionsPlaceholder.innerHTML=sh;
  }

  // 4) header fixo miniaturizado: só navegação + botão "Topo", exibido quando
  //    o cabeçalho principal (app-header) sai de vista ao rolar a página
  const appHeader=document.querySelector('.app-header');
  if(appHeader){
    const mini=document.createElement('div');
    mini.className='mini-header';
    mini.innerHTML='<div class="mini-header-inner">'+navHtml(cur)
      +'<button type="button" class="top-btn" title="Voltar ao topo da página">Topo <span aria-hidden="true">↑</span></button></div>';
    document.body.appendChild(mini);
    mini.querySelector('.top-btn').addEventListener('click',()=>{
      window.scrollTo({top:0,behavior:'smooth'});
    });
    if('IntersectionObserver' in window){
      new IntersectionObserver(entries=>{
        const e=entries[0];
        // só mostra quando o cabeçalho saiu por CIMA da tela (rolagem para baixo)
        mini.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top<0);
      },{threshold:0}).observe(appHeader);
    } else {
      // fallback para navegadores sem IntersectionObserver
      window.addEventListener('scroll',()=>{
        const r=appHeader.getBoundingClientRect();
        mini.classList.toggle('show', r.bottom<0);
      },{passive:true});
    }
  }
});
