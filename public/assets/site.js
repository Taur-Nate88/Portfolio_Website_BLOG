(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-nav');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menu.setAttribute('aria-expanded','false');
    }));
  }
  const search = document.querySelector('#article-search');
  const cards = Array.from(document.querySelectorAll('#article-grid .article-card'));
  const filters = Array.from(document.querySelectorAll('[data-filter]'));
  const noResults = document.querySelector('#no-results');
  if (cards.length) {
    let category = 'all';
    const apply = () => {
      const q = (search?.value || '').trim().toLowerCase();
      let visible = 0;
      cards.forEach(card => {
        const ok = (category === 'all' || card.dataset.category === category) && (!q || (card.dataset.search || '').includes(q));
        card.hidden = !ok;
        if (ok) visible++;
      });
      if (noResults) noResults.hidden = visible !== 0;
    };
    filters.forEach(btn => btn.addEventListener('click', () => {
      category = btn.dataset.filter || 'all';
      filters.forEach(f => { f.classList.toggle('active', f === btn); f.setAttribute('aria-pressed',String(f === btn)); });
      apply();
    }));
    search?.addEventListener('input', apply);
  }
})();
