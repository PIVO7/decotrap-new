// Fotogalerij met lightbox: de aangeklikte foto vloeit vanuit het raster open (GSAP Flip).
// Gebaseerd op 'Lightbox Setup' van Osmo Supply. Aanpassingen voor Decotrap: achtergrond in de huisstijlkleur,
// grote fotoversie zodra hij open staat, pagina scrollt niet mee, focus voor toetsenbordgebruikers, minder beweging indien gevraagd.
(function () {
	if (!window.gsap || !window.Flip) return;
	gsap.registerPlugin(Flip);

	gsap.defaults({
		ease: "power4.inOut",
		duration: 0.8,
	});

	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function createLightbox(container, {
		onStart,
		onOpen,
		onClose,
		onCloseComplete
	} = {}) {

		const elements = {
			wrapper: container.querySelector('[data-lightbox="wrapper"]'),
			triggers: container.querySelectorAll('[data-lightbox="trigger"]'),
			triggerParents: container.querySelectorAll('[data-lightbox="trigger-parent"]'),
			items: container.querySelectorAll('[data-lightbox="item"]'),
			nav: container.querySelectorAll('[data-lightbox="nav"]'),
			counter: {
				current: container.querySelector('[data-lightbox="counter-current"]'),
				total: container.querySelector('[data-lightbox="counter-total"]')
			},
			buttons: {
				prev: container.querySelector('[data-lightbox="prev"]'),
				next: container.querySelector('[data-lightbox="next"]'),
				close: container.querySelector('[data-lightbox="close"]')
			}
		};

		const mainTimeline = gsap.timeline();
		if (reduceMotion) mainTimeline.timeScale(8);
		let lastTrigger = null;


		// ————————— COUNTER ————————— //
		if (elements.counter.total) {
			elements.counter.total.textContent = elements.triggers.length;
		}


		// ————————— CLOSE FUNCTION ————————— //
		function closeLightbox() {
			onClose?.();

			mainTimeline.clear();
			gsap.killTweensOf([
				elements.wrapper,
				elements.nav,
				elements.triggerParents,
				elements.items,
				container.querySelector('[data-lightbox="original"]')
			]);

			const tl = gsap.timeline({
				defaults: { ease: "power2.inOut" },
				onComplete: () => {
					elements.wrapper.classList.remove('is-active');

					elements.items.forEach(item => {
						item.classList.remove('is-active');
						const lightboxImage = item.querySelector('img');
						if (lightboxImage) {
							lightboxImage.style.display = '';
						}
					});

					const originalImg = container.querySelector('[data-lightbox="original"]');
					if (originalImg) { gsap.set(originalImg, { clearProps: "all" }); }

					const originalParent = container.querySelector('[data-lightbox="original-parent"]');
					if (originalParent) { originalParent.parentElement.style.removeProperty('height'); }

					onCloseComplete?.();
				}
			});

			// de originele foto terug in zijn tegel, met zijn kleine fotoversie
			const originalItem = container.querySelector('[data-lightbox="original"]');
			const originalParent = container.querySelector('[data-lightbox="original-parent"]');

			if (originalItem && originalParent) {
				gsap.set(originalItem, { clearProps: "all" });
				if (originalItem.dataset.sizes) originalItem.sizes = originalItem.dataset.sizes;
				originalParent.appendChild(originalItem);
				originalParent.parentElement.style.removeProperty('height');
				originalParent.removeAttribute('data-lightbox');
				originalParent.setAttribute('data-lightbox', 'trigger');
				originalItem.removeAttribute('data-lightbox');
			}

			let activeLightboxSlide = container.querySelector('[data-lightbox="item"].is-active');

			tl.to(elements.triggerParents, {
				autoAlpha: 1,
				duration: 0.5,
				stagger: 0.03,
				overwrite: true
			})
			.to(elements.nav, {
				autoAlpha: 0,
				y: "1rem",
				duration: 0.4,
				stagger: 0
			}, "<")
			.to(elements.wrapper, {
				backgroundColor: "rgba(35,40,40,0)",
				duration: 0.4
			}, "<")
			.to(activeLightboxSlide, {
				autoAlpha: 0,
				duration: 0.4,
			}, "<")
			.set([elements.items, activeLightboxSlide, elements.triggerParents], { clearProps: "all" });

			mainTimeline.add(tl);

			container.removeEventListener('click', handleOutsideClick);
			if (lastTrigger) lastTrigger.focus({ preventScroll: true });
		}


		// ————————— CLICK-OUTSIDE FUNCTIONALITY ————————— //
		function handleOutsideClick(event) {
			if (event.detail === 0) {
				return;
			}

			const clickedElement = event.target;
			const isOutside = !clickedElement.closest('[data-lightbox="item"].is-active img, [data-lightbox="nav"], [data-lightbox="close"], [data-lightbox="trigger"], [data-lightbox="original-parent"]');

			if (isOutside) {
				closeLightbox();
			}
		}


		// ————————— TOGGLE ACTIVE ITEM IN LIGHTBOX ————————— //
		function updateActiveItem(index) {
			elements.items.forEach(item => item.classList.remove('is-active'));
			elements.items[index].classList.add('is-active');

			// bij bladeren: de foto van de slide zelf tonen (de meegevlogen foto blijft enkel zichtbaar op zijn eigen slide)
			const original = container.querySelector('[data-lightbox="original"]');
			elements.items.forEach((item, i) => {
				const own = item.querySelector('img:not([data-lightbox="original"])');
				if (!own) return;
				own.style.display = (original && item.contains(original)) ? 'none' : '';
			});

			if (elements.counter.current) {
				elements.counter.current.textContent = index + 1;
			}
		}


		// ————————— CLICK TO OPEN ————————— //
		elements.triggers.forEach((trigger, index) => {
			trigger.addEventListener('click', () => {
				if (elements.wrapper.classList.contains('is-active')) return;
				onStart?.();
				lastTrigger = trigger;

				mainTimeline.clear();
				gsap.killTweensOf([
					elements.wrapper,
					elements.nav,
					elements.triggerParents
				]);

				const img = trigger.querySelector("img");
				const state = Flip.getState(img);

				// hoogte van de tegel vasthouden, zodat het raster niet inzakt
				const triggerRect = trigger.getBoundingClientRect();
				trigger.parentElement.style.height = `${triggerRect.height}px`;

				trigger.setAttribute('data-lightbox', 'original-parent');
				img.setAttribute('data-lightbox', 'original');

				// open: de grote fotoversie laden
				img.dataset.sizes = img.sizes;
				img.sizes = '90vw';

				elements.wrapper.classList.add('is-active');
				const targetItem = elements.items[index];

				const tl = gsap.timeline({
					onComplete: () => {
						onOpen?.();
						elements.buttons.close?.focus({ preventScroll: true });
					}
				});

				const lightboxImage = targetItem.querySelector('img');
				if (lightboxImage) {
					lightboxImage.style.display = 'none';
				}

				if (!targetItem.contains(img)) {
					targetItem.appendChild(img);
				}
				updateActiveItem(index);

				container.addEventListener('click', handleOutsideClick);

				elements.triggerParents.forEach(otherTrigger => {
					if (otherTrigger !== trigger.parentElement) {
						gsap.to(otherTrigger, {
							autoAlpha: 0,
							duration: 0.4,
							stagger: 0.02,
							overwrite: true
						});
					}
				});

				tl.add(
					Flip.from(state, {
						targets: img,
						absolute: true,
						duration: 0.6,
						ease: "power2.inOut"
					}), 0
				);

				tl.to(elements.wrapper, {
					backgroundColor: "rgba(35,40,40,0.92)",
					duration: 0.6
				}, 0)
				.fromTo(elements.nav, {
					autoAlpha: 0,
					y: "1rem"
				}, {
					autoAlpha: 1,
					y: "0rem",
					duration: 0.6,
					stagger: { each: 0.05, from: "center" }
				}, 0.2);

				mainTimeline.add(tl);
			});
		});


		// ————————— NAV BUTTONS ————————— //
		if (elements.buttons.next) {
			elements.buttons.next.addEventListener('click', () => {
				const currentIndex = Array.from(elements.items).findIndex(item =>
					item.classList.contains('is-active')
				);
				const nextIndex = (currentIndex + 1) % elements.items.length;
				updateActiveItem(nextIndex);
			});
		}

		if (elements.buttons.prev) {
			elements.buttons.prev.addEventListener('click', () => {
				const currentIndex = Array.from(elements.items).findIndex(item =>
					item.classList.contains('is-active')
				);
				const prevIndex = (currentIndex - 1 + elements.items.length) % elements.items.length;
				updateActiveItem(prevIndex);
			});
		}

		if (elements.buttons.close) {
			elements.buttons.close.addEventListener('click', closeLightbox);
		}


		// ————————— KEYBOARD NAV ————————— //
		document.addEventListener('keydown', (event) => {
			if (!elements.wrapper.classList.contains('is-active')) return;
			switch (event.key) {
				case 'Escape':
					closeLightbox();
					break;
				case 'ArrowRight':
					elements.buttons.next?.click();
					break;
				case 'ArrowLeft':
					elements.buttons.prev?.click();
					break;
				case 'Tab': {
					// focus binnen de lightbox houden
					const f = Array.from(elements.wrapper.querySelectorAll('button'));
					if (!f.length) break;
					if (event.shiftKey && document.activeElement === f[0]) { event.preventDefault(); f[f.length - 1].focus(); }
					else if (!event.shiftKey && document.activeElement === f[f.length - 1]) { event.preventDefault(); f[0].focus(); }
					break;
				}
			}
		});
	}

	document.querySelectorAll("[data-gallery]").forEach((wrapper) => {
		createLightbox(wrapper, {
			onStart: () => { document.documentElement.style.overflow = 'hidden'; document.documentElement.classList.add('lb-open'); },
			onClose: () => { document.documentElement.classList.remove('lb-open'); },
			onCloseComplete: () => { document.documentElement.style.overflow = ''; }
		});
	});
})();
