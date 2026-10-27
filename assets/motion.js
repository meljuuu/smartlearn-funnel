/* Progressive enhancement: content is always visible, even without animation support. */
(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const targets = [...document.querySelectorAll('.hero-handoff, .problem-story, .problem-list article, .approach-heading, .steps li, .offer-note, .form-intro, .questions .faq-layout > div')];
  const revealed = new WeakSet();
  const running = new Map();
  let observer;
  function stop(element) {
    const animation = running.get(element);
    if (animation) { animation.cancel(); running.delete(element); }
  }
  function configure() {
    observer?.disconnect();
    running.forEach((animation, element) => stop(element));
    if (preference.matches) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        observer.unobserve(element);
        if (revealed.has(element)) return;
        revealed.add(element);
        if (element.contains(document.activeElement)) return;
        const animation = element.animate(
          [{ opacity: .45, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)' }
        );
        running.set(element, animation);
        animation.onfinish = () => running.delete(element);
      });
    }, { threshold: .12 });
    targets.forEach(element => { if (!revealed.has(element)) observer.observe(element); });
  }
  // A focus move must never leave a keyboard target moving or faded.
  document.addEventListener('focusin', event => {
    targets.forEach(element => { if (element.contains(event.target)) { revealed.add(element); observer?.unobserve(element); stop(element); } });
  });
  preference.addEventListener('change', configure);
  configure();
})();
