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
