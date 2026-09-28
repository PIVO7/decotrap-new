// Decotrap – homepagina "A · Geist": themaschakelaar (preview), mobiel menu, reveal en treden-animatie.
(function () {
	var root = document.documentElement;

	// Themaschakelaar: lime ↔ zwart-wit. Onthoudt de keuze per browser.
	var buttons = document.querySelectorAll('[data-set-theme]');
	function setTheme(theme) {
		root.dataset.theme = theme;
		buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setTheme === theme)); });
		try { localStorage.setItem('decotrap-thema', theme); } catch (e) {}
	}
	buttons.forEach(function (b) { b.addEventListener('click', function () { setTheme(b.dataset.setTheme); }); });
	setTheme(root.dataset.theme || 'lime');

	// Herofoto wisselen (enkel preview)
	var heroButtons = document.querySelectorAll('[data-set-hero]');
	function setHero(hero) {
		root.dataset.hero = hero;
		heroButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setHero === hero)); });
		try { localStorage.setItem('decotrap-hero', hero); } catch (e) {}
	}
	heroButtons.forEach(function (b) { b.addEventListener('click', function () { setHero(b.dataset.setHero); }); });
	setHero(root.dataset.hero || 'latten');

	// Mobiel menu
	var nav = document.querySelector('.nav');
	var toggle = document.querySelector('.nav__toggle');
	if (toggle) {
		toggle.addEventListener('click', function () {
			var open = nav.classList.toggle('is-open');
			toggle.setAttribute('aria-expanded', String(open));
			toggle.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
		});
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && nav.classList.contains('is-open')) { toggle.click(); toggle.focus(); }
		});
	}

	// Video van de Trap-o-theek in een eenvoudige dialoog
	var videoBtn = document.querySelector('[data-video]');
	if (videoBtn) {
		videoBtn.addEventListener('click', function () {
			var d = document.createElement('dialog');
			d.style.cssText = 'padding:0;border:0;background:#000;max-width:min(1100px,92vw);width:100%';
			d.innerHTML = '<video src="' + videoBtn.dataset.video + '" controls autoplay playsinline style="display:block;width:100%"></video>';
			d.addEventListener('close', function () { d.remove(); });
			d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
			document.body.appendChild(d);
			d.showModal();
		});
	}

	// Reveal-on-scroll en de treden die uit de vloer rijzen
	var targets = document.querySelectorAll('.reveal, .steps');
	if (!('IntersectionObserver' in window)) {
		targets.forEach(function (el) { el.classList.add('is-in'); });
		return;
	}
	var io = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
		});
	}, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
	targets.forEach(function (el) { io.observe(el); });
})();
