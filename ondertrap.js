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

// Werkwijze in drie stappen: klik op een stap, of laat ze vanzelf doorschuiven zolang de sectie in beeld is
(function () {
	var root = document.querySelector('.steps2');
	if (!root) return;
	var items = Array.prototype.slice.call(root.querySelectorAll('.steps2__item'));
	var shots = Array.prototype.slice.call(root.querySelectorAll('.steps2__shot'));
	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var index = 0, inView = false, paused = false;
	function show(i) {
		index = (i + items.length) % items.length;
		items.forEach(function (it, k) {
			var on = k === index;
			it.classList.toggle('is-active', on);
			it.querySelector('.steps2__btn').setAttribute('aria-expanded', String(on));
		});
		shots.forEach(function (sh, k) { sh.classList.toggle('is-active', k === index); });
	}
	function syncPlay() {
		root.classList.toggle('is-playing', !reduce && inView);
		root.classList.toggle('is-paused', paused); // hover of focus: balk pauzeert, begint niet opnieuw
	}
	// voortgangsbalk vol = volgende stap
	items.forEach(function (it, k) {
		it.querySelector('.steps2__bar').addEventListener('animationend', function () {
			if (root.classList.contains('is-playing') && !paused && k === index) show(index + 1);
		});
		it.querySelector('.steps2__btn').addEventListener('click', function () {
			show(k);
			// balk opnieuw laten starten
			root.classList.remove('is-playing'); void root.offsetWidth; syncPlay();
		});
	});
	root.addEventListener('mouseenter', function () { paused = true; syncPlay(); });
	root.addEventListener('mouseleave', function () { paused = false; syncPlay(); });
	root.addEventListener('focusin', function () { paused = true; syncPlay(); });
	root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) { paused = false; syncPlay(); } });
	if ('IntersectionObserver' in window) {
		new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; syncPlay(); }, { threshold: 0.4 }).observe(root);
	}
	show(0);
})();
