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

	// Previewbalk inklappen op mobiel
	var pbar = document.querySelector('.preview-bar');
	var pToggle = pbar && pbar.querySelector('.preview-bar__toggle');
	if (pToggle) pToggle.addEventListener('click', function () {
		var open = pbar.classList.toggle('is-open');
		pToggle.setAttribute('aria-expanded', String(open));
		pToggle.textContent = open ? 'Sluiten' : 'Preview-opties';
	});

	// Herofoto wisselen (enkel preview)
	var heroButtons = document.querySelectorAll('[data-set-hero]');
	function setHero(hero) {
		root.dataset.hero = hero;
		heroButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setHero === hero)); });
		try { localStorage.setItem('decotrap-hero4', hero); } catch (e) {}
	}
	heroButtons.forEach(function (b) { b.addEventListener('click', function () { setHero(b.dataset.setHero); }); });
	setHero(root.dataset.hero || 'zon');

	// Enkel de hero tonen, zonder verder te scrollen (enkel preview; ook via ?pagina=hero)
	var pageButtons = document.querySelectorAll('[data-set-page]');
	function setPage(page) {
		if (page === 'hero') { root.dataset.page = 'hero'; window.scrollTo(0, 0); } else { delete root.dataset.page; }
		pageButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setPage === page)); });
		try { localStorage.setItem('decotrap-pagina', page); } catch (e) {}
	}
	pageButtons.forEach(function (b) { b.addEventListener('click', function () { setPage(b.dataset.setPage); }); });
	setPage(root.dataset.page === 'hero' ? 'hero' : 'volledig');

	// Opbouw van de hero (enkel preview): foto over het hele scherm, of tekst links en foto rechts met de navigatie apart erboven
	var layoutButtons = document.querySelectorAll('[data-set-layout]');
	function setLayout(layout, remember) {
		root.dataset.layout = layout;
		layoutButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setLayout === layout)); });
		if (remember) { try { localStorage.setItem('decotrap-layout', layout); } catch (e) {} } // enkel een echte keuze onthouden, niet een subpagina
	}
	layoutButtons.forEach(function (b) { b.addEventListener('click', function () { setLayout(b.dataset.setLayout, true); }); });
	setLayout(root.dataset.layout === 'split' ? 'split' : 'foto');


	// Trap-o-theek-video: speelt enkel als hij in beeld is, pauzeerbaar, niet vanzelf bij beperkte beweging
	var totVideo = document.querySelector('.tot__video');
	var totPause = document.querySelector('.tot__pause');
	if (totVideo && totPause) {
		var totUserPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		var totVisible = false;
		function syncTot() {
			totPause.setAttribute('aria-pressed', String(totUserPaused));
			totPause.setAttribute('aria-label', totUserPaused ? 'Video afspelen' : 'Video pauzeren');
			if (!totUserPaused && totVisible) {
				if (totVideo.preload === 'none') totVideo.preload = 'auto';
				var p = totVideo.play(); if (p && p.catch) p.catch(function () {});
			} else { totVideo.pause(); }
		}
		totPause.addEventListener('click', function () { totUserPaused = !totUserPaused; syncTot(); });
		if ('IntersectionObserver' in window) {
			new IntersectionObserver(function (entries) { totVisible = entries[0].isIntersecting; syncTot(); }, { threshold: 0.35 }).observe(totVideo);
		}
		syncTot();
	}

	// Collecties: image accordion. Muis opent bij hover, toetsenbord bij focus, aanraken opent met een tik.
	var accItems = Array.prototype.slice.call(document.querySelectorAll('[data-acc]'));
	if (accItems.length) {
		var hoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
		var accTimer;
		function openAcc(item) {
			accItems.forEach(function (it) { it.classList.toggle('is-open', it === item); });
		}
		// Mobiel: stapelkaarten. De vorige kaart krimpt en verdonkert mee met de scroll (geen vastzetten).
		if (window.gsap && window.ScrollTrigger && gsap.matchMedia) {
			gsap.registerPlugin(ScrollTrigger);
			gsap.matchMedia().add('(max-width: 960px) and (prefers-reduced-motion: no-preference)', function () {
				var tweens = [];
				accItems.forEach(function (item, i) {
					var next = accItems[i + 1];
					if (!next) return;
					var shade = item.querySelector('.acc__shade');
					if (!shade) { shade = document.createElement('span'); shade.className = 'acc__shade'; shade.setAttribute('aria-hidden', 'true'); item.appendChild(shade); }
					var tl = gsap.timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top+=' + (84 + (i + 1) * 14), scrub: true } });
					tl.to(item, { scale: 0.92, ease: 'none' }, 0).to(shade, { opacity: 0.45, ease: 'none' }, 0);
					tweens.push(tl);
				});
				return function () {
					tweens.forEach(function (t) { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
					gsap.set(accItems, { clearProps: 'transform' });
					document.querySelectorAll('.acc__shade').forEach(function (s) { s.remove(); });
				};
			});
		}
		// op mobiel is elke kaart 'open'; tikken hoeft niets te openen
		var mobileAcc = window.matchMedia('(max-width: 960px)');
		accItems.forEach(function (item) {
			if (hoverDevice) {
				item.addEventListener('mouseenter', function () { clearTimeout(accTimer); accTimer = setTimeout(function () { openAcc(item); }, 90); });
				item.addEventListener('mouseleave', function () { clearTimeout(accTimer); });
			}
			item.addEventListener('focusin', function () { openAcc(item); });
			item.addEventListener('click', function (e) {
				if (mobileAcc.matches || item.classList.contains('is-open')) return; // open (of mobiel): de link werkt gewoon
				e.preventDefault();
				openAcc(item);
			});
		});
	}

	// Megamenu (desktop): knop opent paneel; muis opent met kleine vertraging; Escape en klik buiten sluiten
	var hero = document.querySelector('.hero');
	var navEl = document.querySelector('.nav');
	var triggers = Array.prototype.slice.call(document.querySelectorAll('.nav__trigger'));
	var scrim = document.createElement('div');
	scrim.className = 'mega-scrim';
	document.body.appendChild(scrim);
	var openName = null, openTimer, closeTimer, suppressHover = false;

	// glijdende lijn onder het menu: volgt muis en focus, rust onder het open paneel
	var menuEl = document.querySelector('.nav__menu');
	var ink = document.createElement('span');
	ink.className = 'nav__ink';
	ink.setAttribute('aria-hidden', 'true');
	menuEl.appendChild(ink);
	menuEl.classList.add('has-ink');
	function moveInk(el) {
		if (!el) { ink.classList.remove('is-on'); return; }
		var m = menuEl.getBoundingClientRect(), r = el.getBoundingClientRect();
		var w = r.width;
		// uit het niets? dan eerst zonder beweging op zijn plaats zetten
		if (!ink.classList.contains('is-on')) {
			ink.classList.add('is-jump');
			ink.style.transform = 'translate(' + (r.left - m.left) + 'px,' + (r.bottom - m.top - 2) + 'px)';
			ink.style.width = w + 'px';
			ink.offsetWidth;
			ink.classList.remove('is-jump');
		}
		ink.style.transform = 'translate(' + (r.left - m.left) + 'px,' + (r.bottom - m.top - 2) + 'px)';
		ink.style.width = w + 'px';
		ink.classList.add('is-on');
	}
	function inkRest() {
		var open = openName && document.querySelector('.nav__trigger[data-mega="' + openName + '"]');
		moveInk(open || null);
	}
	menuEl.querySelectorAll('a, .nav__trigger').forEach(function (el) {
		el.addEventListener('mouseenter', function () { moveInk(el); });
		el.addEventListener('focus', function () { moveInk(el); });
		el.addEventListener('blur', function () { setTimeout(function () { if (!menuEl.contains(document.activeElement)) inkRest(); }, 0); });
	});
	menuEl.addEventListener('mouseleave', function () { setTimeout(inkRest, 60); });
	// foto's in het megamenu alvast laden als de pagina rustig is, zodat ze bij de eerste keer openen meteen klaar staan
	window.addEventListener('load', function () {
		var warm = function () { document.querySelectorAll(root.dataset.menu === 'tekst' || root.dataset.menu === 'groot' ? '.mega-panel img[loading="lazy"]' : '.mega img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; }); };
		if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 3000 }); else setTimeout(warm, 1500);
	});
	window.addEventListener('resize', function () {
		inkRest();
		if (openName && tekstMenu()) gsap.set(megaWrap, { height: megaPanel(openName).offsetHeight });
	});
	var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	// versie 'tekst' (preview): één vlak dat in hoogte meegroeit, naar de Mega Navigation van Osmo
	var megaWrap = document.querySelector('.mega-wrap');
	var megaTl = null;
	function tekstMenu() { return root.dataset.menu === 'tekst' && !!window.gsap; }
	function megaPanel(name) { return document.getElementById('mega-' + name); }
	function megaFade(panel) { return panel.querySelectorAll('.label, .mega__thumbs li, .mega__info li, .mega__alle, .mega-panel'); }
	function megaIndex(name) { return triggers.findIndex(function (t) { return t.dataset.mega === name; }); }
	function morphMega(from, to) {
		var toEl = megaPanel(to), fromEl = from ? megaPanel(from) : null;
		if (megaTl) { megaTl.kill(); megaTl = null; }
		clearTimeout(closingTimer); closingTimer = null;
		hero.classList.remove('is-mega-closing', 'is-mega-switch');
		triggers.forEach(function (t) {
			var p = megaPanel(t.dataset.mega);
			if (p === toEl || p === fromEl) return;
			p.hidden = true;
			gsap.set(megaFade(p), { clearProps: 'all' });
		});
		toEl.hidden = false;
		var h = toEl.offsetHeight, fade = megaFade(toEl);
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			if (fromEl) fromEl.hidden = true;
			gsap.set(fade, { clearProps: 'all' });
			gsap.set(megaWrap, { height: h });
			return;
		}
		var tl = megaTl = gsap.timeline();
		var spread = fade.length > 1 ? { amount: 0.25 } : 0;
		if (fromEl) {
			// wisselen: oude inhoud schuift weg, nieuwe komt binnen vanuit de richting van de muis
			var dir = megaIndex(to) > megaIndex(from) ? 1 : -1, fromFade = megaFade(fromEl);
			gsap.set(fade, { autoAlpha: 0 });
			tl.to(fromFade, { autoAlpha: 0, x: dir * -30, duration: 0.2, ease: 'power2.in' }, 0);
			tl.add(function () { fromEl.hidden = true; gsap.set(fromFade, { clearProps: 'all' }); }, 0.2);
			tl.to(megaWrap, { height: h, duration: 0.4, ease: 'power3.out' }, 0.05);
			tl.fromTo(fade, { autoAlpha: 0, x: dir * 30, y: 0 }, { autoAlpha: 1, x: 0, duration: 0.3, stagger: spread, ease: 'power3.out' }, 0.12);
		} else {
			tl.to(megaWrap, { height: h, duration: 0.35, ease: 'power3.out' }, 0);
			tl.fromTo(fade, { autoAlpha: 0, x: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: spread, ease: 'power3.out' }, 0.1);
		}
	}
	function collapseMega(name) {
		if (megaTl) { megaTl.kill(); megaTl = null; }
		hero.classList.add('is-mega-closing');
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finishClose(); return; }
		var tl = megaTl = gsap.timeline({ onComplete: function () { megaTl = null; finishClose(); } });
		tl.to(megaFade(megaPanel(name)), { autoAlpha: 0, y: -4, duration: 0.14, ease: 'power2.in' }, 0);
		tl.to(megaWrap, { height: 0, duration: 0.25, ease: 'power2.in' }, 0.05);
	}

	function openMega(name) {
		clearTimeout(closeTimer);
		if (openName === name) return;
		hero.style.setProperty('--nav-h', navEl.offsetHeight + 'px');
		if (tekstMenu()) {
			morphMega(openName, name);
			triggers.forEach(function (t) { t.setAttribute('aria-expanded', String(t.dataset.mega === name)); });
			hero.classList.add('is-mega');
			scrim.classList.add('is-on');
			openName = name;
			moveInk(document.querySelector('.nav__trigger[data-mega="' + name + '"]'));
			return;
		}
		// was het paneel nog aan het sluiten? meteen afronden, dan opent het nieuwe proper
		if (closingTimer) finishClose();
		// al een paneel open? dan meteen wisselen, zonder infade
		hero.classList.toggle('is-mega-switch', !!openName);
		// richting van de wissel: naar rechts in het menu = inhoud schuift van rechts binnen
		if (openName) {
			var from = triggers.findIndex(function (t) { return t.dataset.mega === openName; });
			var to = triggers.findIndex(function (t) { return t.dataset.mega === name; });
			hero.style.setProperty('--mega-dir', to > from ? '1' : '-1');
		}
		hero.style.setProperty('--nav-h', navEl.offsetHeight + 'px');
		// cirkel opent vanuit het midden van het gekozen menu-onderdeel
		var tr = document.querySelector('.nav__trigger[data-mega="' + name + '"]');
		if (tr && !openName) { var r = tr.getBoundingClientRect(); hero.style.setProperty('--mega-x', Math.round(r.left + r.width / 2) + 'px'); }
		triggers.forEach(function (t) {
			var on = t.dataset.mega === name;
			t.setAttribute('aria-expanded', String(on));
			document.getElementById('mega-' + t.dataset.mega).hidden = !on;
		});
		hero.classList.add('is-mega');
		scrim.classList.add('is-on');
		openName = name;
		moveInk(document.querySelector('.nav__trigger[data-mega="' + name + '"]'));
	}
	var closingTimer = null;
	function finishClose() {
		clearTimeout(closingTimer); closingTimer = null;
		triggers.forEach(function (t) {
			var p = megaPanel(t.dataset.mega);
			p.hidden = true;
			if (window.gsap) gsap.set(megaFade(p), { clearProps: 'all' });
		});
		if (window.gsap) gsap.set(megaWrap, { clearProps: 'height' });
		hero.classList.remove('is-mega', 'is-mega-closing');
	}
	function closeMega(returnFocus) {
		clearTimeout(openTimer);
		if (!openName) return;
		var trigger = document.querySelector('.nav__trigger[data-mega="' + openName + '"]');
		triggers.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
		scrim.classList.remove('is-on');
		openName = null;
		if (!menuEl.matches(':hover')) moveInk(null);
		if (tekstMenu()) { collapseMega(trigger.dataset.mega); if (returnFocus && trigger) trigger.focus(); return; }
		// sluiten: het paneel krimpt als een cirkel terug naar het menu-onderdeel, daarna pas verbergen
		var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (still) { finishClose(); } else { hero.classList.add('is-mega-closing'); closingTimer = setTimeout(finishClose, 420); }
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
	// muis naar een gewone link in het menu (Trap-o-theek, Over ons): het open paneel sluit, zoals op de meeste sites
	if (finePointer) {
		menuEl.querySelectorAll(':scope > li > a').forEach(function (a) {
			a.addEventListener('mouseenter', function () {
				clearTimeout(openTimer);
				if (openName) { clearTimeout(closeTimer); closeTimer = setTimeout(function () { closeMega(false); }, 120); }
			});
		});
	}
	if (finePointer) {
		document.querySelectorAll('.mega, .nav').forEach(function (el) {
			el.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
			el.addEventListener('mouseleave', function () { closeTimer = setTimeout(function () { closeMega(false); }, 220); });
		});
	}
	scrim.addEventListener('click', function () { closeMega(false); });
	// klik op de gedimde hero (het ::after-vlak) sluit ook
	hero.addEventListener('click', function (e) { if (openName && e.target === hero) closeMega(false); });
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && openName) { suppressHover = true; closeMega(true); }
	});
	// focus die het menu verlaat sluit het paneel
	document.addEventListener('focusin', function (e) {
		if (openName && !e.target.closest('.nav, .mega')) closeMega(false);
	});

	// Megamenu-versie wisselen (enkel preview): huidige foto's, nieuwe foto's, tekst naar Osmo of grote tekst naar Apple
	var menuButtons = document.querySelectorAll('[data-set-menu]');
	var altThumbs = document.querySelectorAll('img[data-src-v2]');
	altThumbs.forEach(function (img) { img.dataset.srcV1 = img.getAttribute('src'); });
	function setMenu(menu) {
		if (openName) closeMega(false);
		if (megaTl) { megaTl.kill(); megaTl = null; }
		finishClose();
		root.dataset.menu = menu;
		menuButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setMenu === menu)); });
		altThumbs.forEach(function (img) {
			img.onerror = menu === 'foto2' ? function () { img.onerror = null; img.src = img.dataset.srcV1; } : null;
			img.src = menu === 'foto2' ? img.dataset.srcV2 : img.dataset.srcV1;
		});
		try { localStorage.setItem('decotrap-menu', menu); } catch (e) {}
	}
	menuButtons.forEach(function (b) { b.addEventListener('click', function () { setMenu(b.dataset.setMenu); }); });
	setMenu(root.dataset.menu || 'groot');

	// Fotoreeks in de hero: laadt pas als de optie gekozen is, pauzeerbaar, stopt bij beperkte beweging
	var reeks = document.querySelector('.hero__reeks');
	var ctrl = document.querySelector('.hero__reeks-ctrl');
	if (reeks && ctrl) {
		var slides = Array.prototype.slice.call(reeks.querySelectorAll('.hero__slide'));
		var bars = Array.prototype.slice.call(ctrl.querySelectorAll('.hero__bars span'));
		var countEl = ctrl.querySelector('[data-count]');
		var pauseBtn = ctrl.querySelector('.hero__pause');
		var DUUR = 7000, index = 0, timer = null, loaded = false, userPaused = false;
		var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		ctrl.style.setProperty('--reeks-duur', DUUR + 'ms');
		function load(slide) {
			slide.querySelectorAll('[data-srcset]').forEach(function (el) { el.srcset = el.dataset.srcset; el.removeAttribute('data-srcset'); });
			var img = slide.querySelector('img[data-src]');
			if (img) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
		}
		function show(i) {
			index = (i + slides.length) % slides.length;
			load(slides[index]);
			load(slides[(index + 1) % slides.length]); // volgende alvast laden
			var prev = reeks.querySelector('.hero__slide.is-active');
			slides.forEach(function (s, k) { s.classList.remove('is-leaving'); s.classList.toggle('is-active', k === index); s.setAttribute('aria-hidden', String(k !== index)); });
			if (prev && prev !== slides[index]) {
				prev.classList.add('is-leaving');
				setTimeout(function () { if (!prev.classList.contains('is-active')) prev.classList.remove('is-leaving'); }, 2400);
			}
			bars.forEach(function (b, k) { b.classList.remove('is-active'); b.classList.toggle('is-done', k < index); });
			void ctrl.offsetWidth; // balkanimatie opnieuw starten
			bars[index].classList.add('is-active');
			countEl.textContent = ('0' + (index + 1)).slice(-2);
		}
		function play() {
			clearInterval(timer);
			if (userPaused || document.hidden || root.dataset.hero !== 'reeks') return;
			freeze(false);
			timer = setInterval(function () { show(index + 1); }, DUUR);
			reeks.classList.remove('is-paused'); ctrl.classList.remove('is-paused');
		}
		function freeze(on) {
			slides.forEach(function (s) {
				var img = s.querySelector('img');
				if (on && (s.classList.contains('is-active') || s.classList.contains('is-leaving'))) {
					img.style.transform = getComputedStyle(img).transform; img.style.transition = 'none';
				} else { img.style.transform = ''; img.style.transition = ''; }
			});
		}
		function stop() {
			freeze(true);
			clearInterval(timer);
			reeks.classList.add('is-paused'); ctrl.classList.add('is-paused');
		}
		function setPaused(p) {
			userPaused = p;
			pauseBtn.setAttribute('aria-pressed', String(p));
			pauseBtn.setAttribute('aria-label', p ? 'Diavoorstelling afspelen' : 'Diavoorstelling pauzeren');
		}
		function activate() {
			if (root.dataset.hero !== 'reeks') { stop(); return; }
			if (!loaded) { loaded = true; show(0); if (reduce) setPaused(true); }
			if (userPaused) { stop(); } else { play(); }
		}
		pauseBtn.addEventListener('click', function () {
			setPaused(!userPaused);
			if (userPaused) { stop(); } else { play(); }
		});
		document.addEventListener('visibilitychange', function () { if (document.hidden) { stop(); } else if (!userPaused) { play(); } });
		new MutationObserver(activate).observe(root, { attributes: true, attributeFilter: ['data-hero'] });
		activate();
	}

	// Treden die meegroeien met scrollen (GSAP ScrollTrigger). Zonder GSAP of bij beperkte beweging
	// blijft de gewone animatie (eenmalig opkomen) actief.
	var stepsSection = document.querySelector('.steps');
	var stepsButtons = document.querySelectorAll('[data-set-steps]');
	var scrubTl = null, mobileTweens = [];
	function canScrub() {
		return window.gsap && window.ScrollTrigger && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}
	function buildScrub() {
		var steps = stepsSection.querySelectorAll('.step');
		var desktop = window.matchMedia('(min-width: 961px)').matches;
		stepsSection.classList.add('steps--scrub');
		if (!desktop) {
			// mobiel: één doorlopende tijdlijn, strikt na elkaar:
			// stap licht op → lijn loopt naar de volgende stap → volgende stap licht op → …
			scrubTl = gsap.timeline({ paused: true }); // houder; de echte tijdlijn staat in mobileTweens
			var first = steps[0], last = steps[steps.length - 1];
			var tl = gsap.timeline({
				defaults: { ease: 'none' },
				scrollTrigger: { trigger: first, endTrigger: last, start: 'top 80%', end: 'top 45%', scrub: 0.5 }
			});
			steps.forEach(function (step, i) {
				var rects = step.querySelectorAll('.stair rect.on');
				var body = step.querySelectorAll('h3, p');
				var fill = step.querySelector('.step__line > span');
				gsap.set(rects, { opacity: 0.25 });
				gsap.set(body, { opacity: 0.3 });
				if (fill) gsap.set(fill, { scaleY: 0 });
				tl.to(rects, { opacity: 1, duration: 0.35, stagger: 0.08 })
				  .to(body, { opacity: 1, duration: 0.35 }, '<');
				if (fill) tl.to(fill, { scaleY: 1, duration: 1 });
			});
			mobileTweens.push(tl);
			return;
		}
		scrubTl = gsap.timeline({
			defaults: { ease: 'none' },
			scrollTrigger: { trigger: stepsSection, start: 'top top', end: '+=140%', pin: true, scrub: 0.6, anticipatePin: 1 }
		});
		steps.forEach(function (step, i) {
			var at = i * 0.9;
			scrubTl.fromTo(step, { scaleY: 0, transformOrigin: 'bottom' }, { scaleY: 1, duration: 1, ease: 'power2.out' }, at);
			scrubTl.fromTo(step.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 }, at + 0.55);
			scrubTl.fromTo(step.querySelectorAll('.stair rect.on'), { opacity: 0.2 }, { opacity: 1, duration: 0.3, stagger: 0.1 }, at + 0.6);
		});
		scrubTl.to({}, { duration: 0.6 });
	}
	function killScrub() {
		if (!scrubTl) return;
		scrubTl.scrollTrigger && scrubTl.scrollTrigger.kill(true);
		mobileTweens.forEach(function (t) { t.scrollTrigger && t.scrollTrigger.kill(true); t.kill(); });
		mobileTweens = [];
		scrubTl.kill();
		scrubTl = null;
		gsap.set(stepsSection.querySelectorAll('.step, .step > *, .step h3, .step p, .stair rect, .step__line > span'), { clearProps: 'all' });
		stepsSection.classList.remove('steps--scrub');
	}
	function setSteps(mode) {
		stepsButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setSteps === mode)); });
		try { localStorage.setItem('decotrap-treden', mode); } catch (e) {}
		if (!stepsSection || !window.gsap) return;
		killScrub();
		if (mode === 'scroll' && canScrub()) { buildScrub(); stepsSection.classList.add('is-in'); }
		ScrollTrigger.refresh();
	}
	if (stepsSection) {
		if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
		var stepsMode = 'scroll';
		try { stepsMode = localStorage.getItem('decotrap-treden') || 'scroll'; } catch (e) {}
		stepsButtons.forEach(function (b) { b.addEventListener('click', function () { setSteps(b.dataset.setSteps); }); });
		setSteps(stepsMode);
		// bij wisselen tussen gsm- en desktopbreedte de tijdlijn opnieuw opbouwen
		var wasDesktop = window.matchMedia('(min-width: 961px)').matches;
		window.addEventListener('resize', function () {
			var isDesktop = window.matchMedia('(min-width: 961px)').matches;
			if (isDesktop !== wasDesktop && scrubTl) { wasDesktop = isDesktop; setSteps('scroll'); }
		});
		// herofoto's en lettertypes veranderen de hoogte van de pagina: posities herberekenen
		window.addEventListener('load', function () { window.ScrollTrigger && ScrollTrigger.refresh(); });
	}

	// Vaste CTA-balk op mobiel: verschijnt na de hero, verdwijnt bij de CTA-sectie en de footer
	var mbar = document.querySelector('.mbar');
	var ctaSection = document.querySelector('.tot__visit'); // daar staan dezelfde knoppen al
	var footerEl = document.querySelector('.footer, .sfoot');
	if (mbar && 'IntersectionObserver' in window) {
		var heroVisible = true, endVisible = false;
		function syncBar() {
			var on = !heroVisible && !endVisible && (!mnav || mnav.hidden);
			mbar.classList.toggle('is-on', on);
			mbar.setAttribute('aria-hidden', String(!on));
			mbar.querySelectorAll('a').forEach(function (a) { if (on) { a.removeAttribute('tabindex'); } else { a.setAttribute('tabindex', '-1'); } });
		}
		new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; syncBar(); }, { threshold: 0.15 }).observe(document.querySelector('.hero'));
		var endIO = new IntersectionObserver(function (entries) {
			endVisible = entries.some(function (x) { return x.isIntersecting; }) || [ctaSection, footerEl].some(function (el) { return el && el.getBoundingClientRect().top < window.innerHeight; });
			syncBar();
		});
		[ctaSection, footerEl].forEach(function (el) { if (el) endIO.observe(el); });
		window.addEventListener('decotrap:mnav', syncBar);
	}

	// Veegbare rijen (projecten, reviews): bolletjes volgen de kaart die vooraan staat
	function bindDots(list, dots, itemSel) {
		if (!list || !dots.length) return;
		var raf;
		list.addEventListener('scroll', function () {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(function () {
				var items = list.querySelectorAll(itemSel), left = list.getBoundingClientRect().left, best = 0, bestD = Infinity;
				items.forEach(function (it, k) { var d = Math.abs(it.getBoundingClientRect().left - left - 20); if (d < bestD) { bestD = d; best = k; } });
				dots.forEach(function (d, k) { d.classList.toggle('is-on', k === best); });
			});
		}, { passive: true });
	}
	bindDots(document.querySelector('.projects__list'), document.querySelectorAll('.projects__dots span'), '.project');

	// Realisaties op desktop: projectindex. Hover, focus of klik op een project toont zijn foto's in de bühne
	var projects = Array.prototype.slice.call(document.querySelectorAll('.project'));
	var projMq = window.matchMedia('(min-width: 961px)');
	function setProject(p) { projects.forEach(function (q) { var on = q === p; q.classList.toggle('is-active', on); q.querySelector('.project__txt').setAttribute('aria-current', on ? 'true' : 'false'); }); }
	projects.forEach(function (p) {
		var txt = p.querySelector('.project__txt');
		txt.addEventListener('mouseenter', function () { if (projMq.matches) setProject(p); });
		txt.addEventListener('focus', function () { setProject(p); });
		txt.addEventListener('click', function () { setProject(p); });
	});
	function syncProjTabs() { projects.forEach(function (p) { var t = p.querySelector('.project__txt'); if (projMq.matches) t.setAttribute('tabindex', '0'); else t.removeAttribute('tabindex'); }); }
	if (projects.length) { setProject(projects[0]); syncProjTabs(); projMq.addEventListener('change', syncProjTabs); }

	// Reviews op mobiel: bolletjes volgen de veegbeweging
	var proof = document.querySelector('.proof');
	var dots = document.querySelectorAll('.proof__dots span');
	if (proof && dots.length) {
		var dotTimer;
		proof.addEventListener('scroll', function () {
			cancelAnimationFrame(dotTimer);
			dotTimer = requestAnimationFrame(function () {
				var items = proof.querySelectorAll('.proof__item');
				var left = proof.getBoundingClientRect().left, best = 0, bestD = Infinity;
				items.forEach(function (it, k) { var d = Math.abs(it.getBoundingClientRect().left - left - 20); if (d < bestD) { bestD = d; best = k; } });
				dots.forEach(function (d, k) { d.classList.toggle('is-on', k === best); });
			});
		}, { passive: true });
	}

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
	var mnavCloseTimer;
	function openMnav() {
		clearTimeout(mnavCloseTimer);
		// de cirkel groeit vanuit het midden van de menuknop
		var r = mToggle.getBoundingClientRect();
		mnav.style.setProperty('--mx', (r.left + r.width / 2) + 'px');
		mnav.style.setProperty('--my', (r.top + r.height / 2) + 'px');
		mnav.hidden = false;
		void mnav.offsetWidth;
		mnav.classList.add('is-open');
		document.body.style.overflow = 'hidden';
		mToggle.setAttribute('aria-expanded', 'true');
		window.dispatchEvent(new Event('decotrap:mnav'));
		showView('root');
	}
	function closeMnav() {
		mnav.classList.remove('is-open');
		var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mnavCloseTimer = setTimeout(function () { mnav.hidden = true; }, reduce ? 0 : 640);
		document.body.style.overflow = '';
		mToggle.setAttribute('aria-expanded', 'false');
		window.dispatchEvent(new Event('decotrap:mnav'));
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
			if (mnav.hidden) return;
			if (e.key === 'Escape') { closeMnav(); return; }
			// Tab blijft binnen het open menu (het is een dialoog over de pagina)
			if (e.key === 'Tab') {
				var f = Array.prototype.filter.call(mnav.querySelectorAll('a, button'), function (el) { return el.offsetParent !== null; });
				if (!f.length) return;
				var first = f[0], last = f[f.length - 1];
				if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
				else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
			}
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
