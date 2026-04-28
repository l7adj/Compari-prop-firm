(()=>{
function ready(){return window.ProTableEngine&&window.FundingDataNormalizer&&window.ProTableEngine.renderReview&&!window.__reviewNormalizedBootstrap}
function apply(){if(!ready())return false;window.__reviewNormalizedBootstrap=true;const oldRender=window.ProTableEngine.renderReview;window.ProTableEngine.renderReview=function(company){const normalized=window.FundingDataNormalizer.company(company);return oldRender(normalized)};return true}
if(!apply())document.addEventListener('DOMContentLoaded',()=>apply());
})();