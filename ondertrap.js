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

// Werkwijze in drie stappen (naar 'van dichtbij' op apple.com): bubbels links, de gekozen bubbel klapt open met uitleg, foto rechts; pijltjes om te bladeren
(function () {
	var root = document.querySelector('.steps3');
	if (!root) return;
	var pills = Array.prototype.slice.call(root.querySelectorAll('.steps3__pill'));
	var shots = Array.prototype.slice.call(root.querySelectorAll('.steps3__shot'));
	var arrows = Array.prototype.slice.call(root.querySelectorAll('.steps3__arrow'));
	var index = 0;
	function show(i) {
		var prev = index;
		index = Math.max(0, Math.min(pills.length - 1, i));
		// gsm: de nieuwe kaart schuift in vanuit de richting waarin je navigeert
		if (index !== prev) {
			var li = pills[index].parentNode;
			li.classList.remove('is-in-fwd', 'is-in-back');
			void li.offsetWidth;
			li.classList.add(index > prev ? 'is-in-fwd' : 'is-in-back');
		}
		pills.forEach(function (p, k) { var on = k === index; p.classList.toggle('is-active', on); p.setAttribute('aria-expanded', String(on)); });
		shots.forEach(function (s, k) { s.classList.toggle('is-active', k === index); });
		arrows.forEach(function (a) { a.disabled = (a.dataset.dir === '-1' && index === 0) || (a.dataset.dir === '1' && index === pills.length - 1); });
	}
	pills.forEach(function (p, k) { p.addEventListener('click', function () { show(k); }); });
	arrows.forEach(function (a) { a.addEventListener('click', function () { show(index + Number(a.dataset.dir)); }); });
	// horizontaal swipen over foto en kaart
	var box = root.querySelector('.steps3__box'), x0 = null, y0 = 0;
	box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
	box.addEventListener('touchend', function (e) {
		if (x0 === null) return;
		var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
		x0 = null;
		if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
	}, { passive: true });
	show(0);
})();
