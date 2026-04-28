(()=>{
function load(){
  if(document.querySelector('#site-layout-v1'))return;
  const l=document.createElement('link');
  l.id='site-layout-v1';
  l.rel='stylesheet';
  l.href='/Compari-prop-firm/docs/assets/css/site-layout-v1.css?v=1';
  document.head.appendChild(l);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();