document.addEventListener('DOMContentLoaded',function(){
  var map={
    '/category/cfd-prop-firms/':'cfd_prop_firm',
    '/category/futures-prop-firms/':'futures_prop_firm',
    '/category/crypto-prop-firms/':'crypto_prop_firm',
    '/category/brokers/':'broker',
    '/category/crypto-exchanges/':'crypto_exchange'
  };
  var path=location.pathname;
  var category=null;
  Object.keys(map).forEach(function(k){if(path.indexOf(k)>-1)category=map[k];});
  if(!category)return;
  var base=path.indexOf('/Compari-prop-firm/')===0?'/Compari-prop-firm/':'/';
  fetch(base+'src/data/pro-trader-review-taxonomy.json',{cache:'no-store'})
    .then(function(r){return r.json();})
    .then(function(data){
      var cfg=data.categories&&data.categories[category];
      if(!cfg)return;
      var container=document.querySelector('main .container');
      if(!container||document.querySelector('.pro-checklist-section'))return;
      var anchor=document.querySelector('.filters-bar')||document.querySelector('main .table-wrapper')||container.children[2];
      var section=document.createElement('section');
      section.className='pro-checklist-section';
      section.innerHTML='<div class="pro-checklist-head"><span class="kicker">معيار المتداول المحترف</span><h2>'+escapeHtml(cfg.title)+'</h2><p>'+escapeHtml(cfg.core_question)+'</p></div><div class="pro-checklist-grid">'+cfg.sections.map(function(sec){return '<article class="pro-check-card"><h3>'+escapeHtml(sec.title)+'</h3><ul>'+sec.items.map(function(item){return '<li>'+escapeHtml(item)+'</li>';}).join('')+'</ul></article>';}).join('')+'</div>';
      if(anchor)container.insertBefore(section,anchor);else container.appendChild(section);
    }).catch(function(){});
});
function escapeHtml(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}
