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

// Werkwijze in drie stappen: één vastgezet scherm; scrollen schuift door de stappen.
// Vloeiend: de voortgang volgt de scrollpositie met zachte demping (per beeld), en een stap wisselt pas net voorbij het omslagpunt.
(function () {
	var wrap = document.querySelector('.steps2-scroll');
	var root = document.querySelector('.steps2');
	if (!wrap || !root) return;
	var items = Array.prototype.slice.call(root.querySelectorAll('.steps2__item'));
	var shots = Array.prototype.slice.call(root.querySelectorAll('.steps2__shot'));
	var bars = items.map(function (it) { return it.querySelector('.steps2__bar'); });
	var n = items.length, index = -1, target = 0, current = 0, running = false, near = false;
	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
	function measure() {
		var range = wrap.offsetHeight - root.offsetHeight;
		target = Math.min(1, Math.max(0, -wrap.getBoundingClientRect().top / Math.max(range, 1))) * n;
	}
	function render() {
		// stap kiezen met een kleine marge rond het omslagpunt (geen geflikker bij traag scrollen)
		var i = index < 0 ? Math.min(n - 1, Math.floor(current)) : index;
		if (current > i + 1 + 0.04 && i < n - 1) i = Math.min(n - 1, Math.floor(current - 0.04));
		if (current < i - 0.04 && i > 0) i = Math.max(0, Math.floor(current + 0.04));
		show(i);
		bars.forEach(function (b, k) {
			var v = k < index ? 1 : k > index ? 0 : Math.min(1, Math.max(0, current - k));
			b.style.transform = 'scaleY(' + v.toFixed(4) + ')';
		});
	}
	function tick() {
		measure();
		current += (target - current) * (reduce ? 1 : 0.14);   // demping: volgt de scroll zacht
		if (Math.abs(target - current) < 0.0005) current = target;
		render();
		if (near) { requestAnimationFrame(tick); } else { running = false; } // loopt enkel zolang de sectie in de buurt is
	}
	function start() { if (!running && pinned()) { running = true; requestAnimationFrame(tick); } }
	// enkel animeren als de sectie (bijna) in beeld is
	if ('IntersectionObserver' in window) {
		new IntersectionObserver(function (e) { near = e[0].isIntersecting; if (near) start(); }, { rootMargin: '200px 0px' }).observe(wrap);
	}
	window.addEventListener('scroll', start, { passive: true });
	window.addEventListener('resize', start);
	// niet vastgezet (laag scherm of minder beweging): gewone klikbare stappen
	items.forEach(function (it, k) {
		it.querySelector('.steps2__btn').addEventListener('click', function () {
			if (!pinned()) { show(k); bars.forEach(function (b, j) { b.style.transform = 'scaleY(' + (j === k ? 1 : 0) + ')'; }); return; }
			var range = wrap.offsetHeight - root.offsetHeight;
			var y = wrap.getBoundingClientRect().top + window.scrollY + range * ((k + 0.2) / n);
			window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
		});
	});
	measure(); current = target; render();
	if (!pinned()) { show(0); bars[0].style.transform = 'scaleY(1)'; }
})();
