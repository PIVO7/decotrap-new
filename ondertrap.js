// Multiplex ondertrap: foto's van de realisaties groot bekijken (dialoog met vorige/volgende, pijltjestoetsen en Escape)
(function () {
	var links = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
	var box = document.querySelector('.lightbox');
	if (!links.length || !box || !box.showModal) return;
	var img = box.querySelector('img');
	var index = 0;
	function show(i) {
		index = (i + links.length) % links.length;
		var a = links[index], thumb = a.querySelector('img');
		img.src = a.getAttribute('href');
		img.alt = thumb ? thumb.alt : '';
		img.width = +a.dataset.w; img.height = +a.dataset.h;
	}
	links.forEach(function (a, i) {
		a.addEventListener('click', function (e) {
			e.preventDefault();
			show(i);
			box.showModal();
		});
	});
	box.querySelector('.lightbox__close').addEventListener('click', function () { box.close(); });
	box.querySelector('.lightbox__prev').addEventListener('click', function () { show(index - 1); });
	box.querySelector('.lightbox__next').addEventListener('click', function () { show(index + 1); });
	box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
	box.addEventListener('keydown', function (e) {
		if (e.key === 'ArrowLeft') show(index - 1);
		if (e.key === 'ArrowRight') show(index + 1);
	});
	box.addEventListener('close', function () { links[index].focus(); });
})();

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
