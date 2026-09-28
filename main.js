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
		try { localStorage.setItem('decotrap-hero', hero); } catch (e) {}
	}
	heroButtons.forEach(function (b) { b.addEventListener('click', function () { setHero(b.dataset.setHero); }); });
	setHero(root.dataset.hero || 'latten');

	// Herokop A/B (enkel preview)
	var kopButtons = document.querySelectorAll('[data-set-kop]');
	function setKop(k) {
		root.dataset.kop = k;
		kopButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setKop === k)); });
		try { localStorage.setItem('decotrap-kop', k); } catch (e) {}
	}
	kopButtons.forEach(function (b) { b.addEventListener('click', function () { setKop(b.dataset.setKop); }); });
	setKop(root.dataset.kop || 'a');

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
	var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	function openMega(name) {
		clearTimeout(closeTimer);
		if (openName === name) return;
		// al een paneel open? dan meteen wisselen, zonder infade
		hero.classList.toggle('is-mega-switch', !!openName);
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
	// klik op de gedimde hero (het ::after-vlak) sluit ook
	hero.addEventListener('click', function (e) { if (openName && e.target === hero) closeMega(false); });
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && openName) { suppressHover = true; closeMega(true); }
	});
	// focus die het menu verlaat sluit het paneel
	document.addEventListener('focusin', function (e) {
		if (openName && !e.target.closest('.nav, .mega')) closeMega(false);
	});

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
			// mobiel: de lime lijn groeit van trapje naar trapje en elke stap licht op als je hem bereikt
			scrubTl = gsap.timeline({ paused: true }); // houder; de losse tweens staan in mobileTweens
			steps.forEach(function (step, i) {
				var fill = step.querySelector('.step__line > span');
				var body = step.querySelectorAll('h3, p');
				var rects = step.querySelectorAll('.stair rect.on');
				var t = { trigger: step, start: 'top 72%', end: 'bottom 62%', scrub: 0.4 };
				mobileTweens.push(gsap.fromTo(body, { opacity: 0.3 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: step, start: 'top 80%', end: 'top 60%', scrub: 0.4 } }));
				mobileTweens.push(gsap.fromTo(rects, { opacity: 0.25 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: step, start: 'top 80%', end: 'top 62%', scrub: 0.4 } }));
				if (fill) mobileTweens.push(gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: t }));
			});
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
	var ctaSection = document.querySelector('.cta');
	var footerEl = document.querySelector('.footer');
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
