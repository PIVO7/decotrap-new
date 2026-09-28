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

	// Megamenu (desktop): knop opent paneel; muis opent met kleine vertraging; Escape en klik buiten sluiten
	var hero = document.querySelector('.hero');
	var navEl = document.querySelector('.nav');
	var triggers = Array.prototype.slice.call(document.querySelectorAll('.nav__trigger'));
	var scrim = document.createElement('div');
	scrim.className = 'mega-scrim';
	document.body.appendChild(scrim);
	var openName = null, openTimer, closeTimer, suppressHover = false;
	var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	function openMega(name) {
		clearTimeout(closeTimer);
		hero.style.setProperty('--nav-h', navEl.offsetHeight + 'px');
		triggers.forEach(function (t) {
			var on = t.dataset.mega === name;
			t.setAttribute('aria-expanded', String(on));
			document.getElementById('mega-' + t.dataset.mega).hidden = !on;
		});
		hero.classList.add('is-mega');
		scrim.classList.add('is-on');
		openName = name;
	}
	function closeMega(returnFocus) {
		clearTimeout(openTimer);
		if (!openName) return;
		var trigger = document.querySelector('.nav__trigger[data-mega="' + openName + '"]');
		triggers.forEach(function (t) {
			t.setAttribute('aria-expanded', 'false');
			document.getElementById('mega-' + t.dataset.mega).hidden = true;
		});
		hero.classList.remove('is-mega');
		scrim.classList.remove('is-on');
		openName = null;
		if (returnFocus && trigger) trigger.focus();
	}
	triggers.forEach(function (t) {
		t.addEventListener('click', function () {
			if (openName === t.dataset.mega) { closeMega(false); } else { openMega(t.dataset.mega); }
		});
		if (finePointer) {
			t.addEventListener('mouseenter', function () {
				if (suppressHover) return; // na Escape pas opnieuw openen als de muis eerst weggaat
				clearTimeout(openTimer); clearTimeout(closeTimer);
				// al open? meteen wisselen, anders even wachten zodat voorbijschuiven niets opent
				openTimer = setTimeout(function () { openMega(t.dataset.mega); }, openName ? 0 : 120);
			});
			t.addEventListener('mouseleave', function () { clearTimeout(openTimer); suppressHover = false; });
		}
	});
	if (finePointer) {
		document.querySelectorAll('.mega, .nav').forEach(function (el) {
			el.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
			el.addEventListener('mouseleave', function () { closeTimer = setTimeout(function () { closeMega(false); }, 220); });
		});
	}
	scrim.addEventListener('click', function () { closeMega(false); });
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && openName) { suppressHover = true; closeMega(true); }
	});
	// focus die het menu verlaat sluit het paneel
	document.addEventListener('focusin', function (e) {
		if (openName && !e.target.closest('.nav, .mega')) closeMega(false);
	});

	// Mobiel menu met doorklikpanelen
	var mnav = document.getElementById('mnav');
	var mToggle = document.querySelector('.nav__toggle');
	var mClose = mnav && mnav.querySelector('.mnav__close');
	function showView(name, focusEl) {
		mnav.querySelectorAll('[data-view]').forEach(function (v) { v.hidden = v.dataset.view !== name; });
		mnav.querySelectorAll('[data-open-view]').forEach(function (b) { b.setAttribute('aria-expanded', String(b.dataset.openView === name)); });
		mnav.scrollTop = 0;
		var target = focusEl || mnav.querySelector('[data-view="' + name + '"] ' + (name === 'root' ? 'button, a' : '[data-back]'));
		if (target) target.focus();
	}
	function openMnav() {
		mnav.hidden = false;
		document.body.style.overflow = 'hidden';
		mToggle.setAttribute('aria-expanded', 'true');
		showView('root');
	}
	function closeMnav() {
		mnav.hidden = true;
		document.body.style.overflow = '';
		mToggle.setAttribute('aria-expanded', 'false');
		mToggle.focus();
	}
	if (mnav && mToggle) {
		mToggle.addEventListener('click', openMnav);
		mClose.addEventListener('click', closeMnav);
		mnav.addEventListener('click', function (e) {
			var opener = e.target.closest('[data-open-view]');
			if (opener) { showView(opener.dataset.openView); return; }
			if (e.target.closest('[data-back]')) {
				var from = mnav.querySelector('[data-view]:not([hidden])').dataset.view;
				showView('root', mnav.querySelector('[data-open-view="' + from + '"]'));
				return;
			}
			if (e.target.closest('a[href^="#"]')) closeMnav();
		});
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && !mnav.hidden) closeMnav();
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
