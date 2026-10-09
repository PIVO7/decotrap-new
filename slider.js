// Fotoslider met parallax (Smooothy + GSAP), naar 'Parallax Image Slider' van Osmo Supply.
// Toegevoegd voor Decotrap: vorige/volgende-pijltjes, en geen parallax bij beperkte beweging.
function initParallaxImageSlider() {
  document.querySelectorAll("[data-parallax-init]").forEach((root) => {
    // The smooothy list
    const wrapper = root.querySelector("[data-parallax-slider]");
    if (!wrapper) return;

    // One parallax layer per slide (optional)
    const parallaxItems = [...wrapper.children].map((slide) => slide.querySelector("[data-parallax-inner]"));

    // Parallax amount (0 bij beperkte beweging)
    const amountAttr = wrapper.getAttribute("data-parallax-amount");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const amount = reduceMotion ? 0 : (amountAttr !== null ? parseFloat(amountAttr) : 12);

    // Snap to a slide
    const snap = wrapper.getAttribute("data-parallax-snap") !== "false";

    // Loop
    const infinite = wrapper.getAttribute("data-parallax-infinite") !== "false";

    // Slide smoothing
    const lerpAttr = wrapper.getAttribute("data-parallax-lerp");
    const lerp = lerpAttr !== null ? parseFloat(lerpAttr) : 0.3;

    const maxOffset = 15; // foto is 130% breed (15% marge per kant), zodat portretfoto's minder ingezoomd zijn

    const slider = new Smooothy(wrapper, {
      infinite,
      snap,
      lerpFactor: lerp,
      onUpdate: ({ parallaxValues }) => {
        parallaxItems.forEach((item, i) => {
          if (!item) return;
          const offset = gsap.utils.clamp(-maxOffset, maxOffset, parallaxValues[i] * amount);
          item.style.transform = `translateX(${offset}%)`;
        });
      },
    });

    gsap.ticker.add(() => slider.update());

    // Pijltjes: de knoppen staan in dezelfde sectie als de slider
    const section = root.closest("section") || document;
    section.querySelector("[data-parallax-prev]")?.addEventListener("click", () => slider.goToPrev());
    section.querySelector("[data-parallax-next]")?.addEventListener("click", () => slider.goToNext());
  });
}

// Initialize Parallax Image Slider (Smooothy)
if (window.Smooothy && window.gsap) initParallaxImageSlider();
