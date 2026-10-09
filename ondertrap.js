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
