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
