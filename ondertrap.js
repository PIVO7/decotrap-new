// Sub-navigatie: de link van de sectie die in beeld is krijgt de groene lijn
(function () {
	var links = Array.prototype.slice.call(document.querySelectorAll('.subnav__links a'));
	if (!links.length || !('IntersectionObserver' in window)) return;
	var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
	var io = new IntersectionObserver(function (entries) {
		entries.forEach(function (e) {
			if (!e.isIntersecting) return;
			links.forEach(function (a) { a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)); });
			var active = links.find(function (a) { return a.getAttribute('aria-current') === 'true'; });
			if (active && active.scrollIntoView && window.matchMedia('(max-width: 960px)').matches) active.parentNode.parentNode.scrollTo({ left: active.offsetLeft - 20, behavior: 'smooth' });
		});
	}, { rootMargin: '-40% 0px -55% 0px' });
	sections.forEach(function (s) { io.observe(s); });
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

// Werkwijze in drie stappen: één vastgezet scherm; scrollen schuift door naar de volgende stap, de groene lijn volgt de voortgang
(function () {
	var wrap = document.querySelector('.steps2-scroll');
	var root = document.querySelector('.steps2');
	if (!wrap || !root) return;
	var items = Array.prototype.slice.call(root.querySelectorAll('.steps2__item'));
	var shots = Array.prototype.slice.call(root.querySelectorAll('.steps2__shot'));
	var n = items.length, index = -1, raf = 0;
	function show(i) {
		if (i === index) return;
		index = i;
		items.forEach(function (it, k) {
			var on = k === index;
			it.classList.toggle('is-active', on);
			it.classList.toggle('is-done', k < index);
			it.querySelector('.steps2__btn').setAttribute('aria-expanded', String(on));
		});
		shots.forEach(function (sh, k) { sh.classList.toggle('is-active', k === index); });
	}
	function pinned() { return getComputedStyle(root).position === 'sticky'; }
	function update() {
		raf = 0;
		if (!pinned()) { items.forEach(function (it) { it.style.removeProperty('--p'); }); if (index < 0) show(0); return; }
		var top = wrap.getBoundingClientRect().top;
		var range = wrap.offsetHeight - root.offsetHeight;          // hoeveel er te scrollen valt terwijl het scherm vaststaat
		var p = Math.min(1, Math.max(0, -top / Math.max(range, 1))); // 0 → 1 over de hele sectie
		var pos = p * n;
		var i = Math.min(n - 1, Math.floor(pos));
		show(i);
		items.forEach(function (it, k) { it.style.setProperty('--p', k < i ? 1 : k > i ? 0 : Math.min(1, pos - i)); });
	}
	function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll);
	// klik op een stap: naar het scrollpunt van die stap
	items.forEach(function (it, k) {
		it.querySelector('.steps2__btn').addEventListener('click', function () {
			if (!pinned()) { show(k); return; }
			var range = wrap.offsetHeight - root.offsetHeight;
			var y = wrap.getBoundingClientRect().top + window.scrollY + range * ((k + 0.15) / n);
			window.scrollTo({ top: y, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
		});
	});
	update();
})();
