document.querySelectorAll<HTMLElement>('[data-case-gallery]').forEach(gallery => {
 const rail = gallery.querySelector<HTMLElement>('.case-gallery-rail');
 const cards = [...gallery.querySelectorAll<HTMLElement>('[data-case-title]')];
 const picker = gallery.querySelector<HTMLElement>('.case-gallery-picker');
 const prev = gallery.querySelector<HTMLButtonElement>('[data-case-prev]');
 const next = gallery.querySelector<HTMLButtonElement>('[data-case-next]');
 const count = gallery.querySelector<HTMLElement>('[data-case-count]');
 if (!rail || !picker || !prev || !next || !count || !cards.length) return;
 let current = 0;
 const go = (index: number) => {
  const target = Math.max(0, Math.min(cards.length - 1, index));
  rail.scrollTo({left: cards[target].offsetLeft - cards[0].offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
 };
 const buttons = cards.map((card,index) => {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = card.dataset.caseTitle || `Кейс ${index+1}`;
  button.setAttribute('aria-controls', rail.id);
  button.addEventListener('click', () => go(index));
  picker.append(button); return button;
 });
 const update = () => {
  const left = rail.getBoundingClientRect().left;
  current = cards.reduce((best,card,i) => Math.abs(card.getBoundingClientRect().left-left) < Math.abs(cards[best].getBoundingClientRect().left-left) ? i : best,0);
  buttons.forEach((button,i) => button.setAttribute('aria-pressed', String(i === current)));
  prev.disabled = current === 0; next.disabled = current === cards.length-1;
  count.textContent = `${current+1} / ${cards.length}`;
 };
 prev.addEventListener('click', () => go(current-1)); next.addEventListener('click', () => go(current+1));
 rail.addEventListener('scroll', update, {passive:true});
 rail.addEventListener('keydown', event => {
  if (event.target !== rail) return;
  const keys: Record<string,number> = {ArrowRight:current+1,ArrowLeft:current-1,Home:0,End:cards.length-1};
  if (!(event.key in keys)) return;
  event.preventDefault(); go(keys[event.key]);
 });
 new ResizeObserver(update).observe(rail);
 const navigation = gallery.querySelector<HTMLElement>('.case-gallery-nav');
 if (navigation) navigation.hidden = cards.length < 2;
 update();
});
