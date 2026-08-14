const drawer = document.getElementById('drawer');
function openMenu(){
  if(!drawer) return;
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false');
  const btn=document.querySelector('.menu-btn'); if(btn) btn.setAttribute('aria-expanded','true');
  document.body.style.overflow='hidden';
}
function closeMenu(){
  if(!drawer) return;
  drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true');
  const btn=document.querySelector('.menu-btn'); if(btn) btn.setAttribute('aria-expanded','false');
  document.body.style.overflow='';
}
document.addEventListener('keydown',e=>{if(e.key==='Escape') closeMenu();});
document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click',closeMenu));
document.querySelectorAll('.drawer-nav a').forEach(a=>a.addEventListener('click',closeMenu));
