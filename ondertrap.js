// Sub-navigatie: de link van de sectie die op 40% van het scherm staat krijgt de groene lijn.
// Op positie berekend (niet via IntersectionObserver), zodat het ook klopt na een sprong via een link.
(function () {
	var links = Array.prototype.slice.call(document.querySelectorAll('.subnav__links a'));
	if (!links.length) return;
	var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
	var current = null, ticking = false;
	function update() {
		ticking = false;
		var line = window.innerHeight * 0.4, found = null;
		sections.forEach(function (s, k) { if (!s) return; var r = s.getBoundingClientRect(); if (r.top <= line && r.bottom > line) found = links[k]; });
		if (found === current) return;
		current = found;
		links.forEach(function (a) { a.setAttribute('aria-current', String(a === found)); });
		if (found && window.matchMedia('(max-width: 960px)').matches) found.parentNode.parentNode.scrollTo({ left: found.offsetLeft - 20, behavior: 'smooth' });
	}
	function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll);
	update();
})();

// Knop in de sub-navigatie pas tonen als de hero uit beeld is (anders staat 'Gratis offerte' drie keer op één scherm)
(function () {
	var subnav = document.querySelector('.subnav');
	var hero = document.querySelector('.hero');
	if (!subnav || !hero || !('IntersectionObserver' in window)) { if (subnav) subnav.classList.add('is-stuck'); return; }
	new IntersectionObserver(function (entries) {
		subnav.classList.toggle('is-stuck', !entries[0].isIntersecting);
	}, { threshold: 0 }).observe(hero);
})();

// Werkwijze in drie stappen (naar 'van dichtbij' op apple.com): bubbels links, de gekozen bubbel klapt open met uitleg, foto rechts; pijltjes om te bladeren
(function () {
	var root = document.querySelector('.steps3');
	if (!root) return;
	var pills = Array.prototype.slice.call(root.querySelectorAll('.steps3__pill'));
	var shots = Array.prototype.slice.call(root.querySelectorAll('.steps3__shot'));
	var arrows = Array.prototype.slice.call(root.querySelectorAll('.steps3__arrow'));
	var dots = Array.prototype.slice.call(root.querySelectorAll('.steps3__dots span'));
	var index = 0;
	var list = root.querySelector('.steps3__list');
	var desktop = window.matchMedia('(min-width: 961px)');
	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
	// de uitleg ligt meteen op zijn eindbreedte, zodat ze tijdens het openen niet herschikt
	function setTextWidth() { root.style.setProperty('--tw', (Math.min(list.clientWidth, 460) - 54) + 'px'); }
	setTextWidth();
	window.addEventListener('resize', setTextWidth);
	// zoals apple.com: eindmaat vooraf meten, dan enkel breedte en hoogte van het kader animeren
	function morph(p, from) {
		if (p._end) p.removeEventListener('transitionend', p._end);
		p.style.transition = 'none'; p.style.width = ''; p.style.height = '';
		var to = p.getBoundingClientRect();
		p.style.width = from.width + 'px'; p.style.height = from.height + 'px';
		void p.offsetWidth;
		p.style.transition = '';
		p.style.width = to.width + 'px'; p.style.height = to.height + 'px';
		p._end = function (e) { if (e.target !== p || e.propertyName !== 'height') return; p.style.width = ''; p.style.height = ''; p.removeEventListener('transitionend', p._end); };
		p.addEventListener('transitionend', p._end);
	}
	function show(i) {
		var prev = index;
		index = Math.max(0, Math.min(pills.length - 1, i));
		var animate = index !== prev && desktop.matches && !reduce.matches;
		var from = animate ? pills.map(function (p) { return p.getBoundingClientRect(); }) : null;
		pills.forEach(function (p, k) { var on = k === index; p.classList.toggle('is-active', on); p.setAttribute('aria-expanded', String(on)); });
		if (animate) { morph(pills[prev], from[prev]); morph(pills[index], from[index]); }
		shots.forEach(function (s, k) { s.classList.toggle('is-active', k === index); });
		dots.forEach(function (d, k) { d.classList.toggle('is-active', k === index); });
		arrows.forEach(function (a) { a.disabled = (a.dataset.dir === '-1' && index === 0) || (a.dataset.dir === '1' && index === pills.length - 1); });
	}
	pills.forEach(function (p, k) { p.addEventListener('click', function () { if (desktop.matches) show(k); }); });
	arrows.forEach(function (a) { a.addEventListener('click', function () {
		var k = Math.max(0, Math.min(pills.length - 1, index + Number(a.dataset.dir)));
		if (desktop.matches) show(k); else scrollToCard(k);
	}); });
	// gsm: de kaarten swipe je native (scroll-snap); de foto en de voortgang volgen de kaart die in beeld staat
	function cardStep() { return pills[0].parentNode.offsetWidth + (parseFloat(getComputedStyle(list).columnGap) || 0); }
	function scrollToCard(k) { list.scrollTo({ left: k * cardStep(), behavior: reduce.matches ? 'auto' : 'smooth' }); }
	var ticking = false;
	list.addEventListener('scroll', function () {
		if (desktop.matches || ticking) return;
		ticking = true;
		requestAnimationFrame(function () {
			ticking = false;
			var k = Math.round(list.scrollLeft / cardStep());
			if (k !== index) show(k);
		});
	}, { passive: true });
	show(0);
})();
