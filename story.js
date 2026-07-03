// Scroll-pinned sequential-narrative hero (Café Oquendo–style), built on
// GSAP + ScrollTrigger (both loaded via <script> before this module).
//
// Progressive enhancement: style.css ships the .story section as a safe,
// always-visible stacked flow by default — that's what renders if this
// script never runs (CDN blocked, JS disabled, older browser). Only once
// GSAP + ScrollTrigger are confirmed present AND the viewport/motion
// conditions allow it do we opt into the pinned/crossfade treatment by
// adding .story--pinned. Mirrors the isolation pattern in gallery-3d.js.

const story = document.querySelector('.story');

if (story && window.gsap && window.ScrollTrigger) {
  try {
    initStory(story);
  } catch (err) {
    console.error('Story scroll animation failed to initialize, showing static fallback.', err);
  }
}

function initStory(story) {
  gsap.registerPlugin(ScrollTrigger);

  const stages = gsap.utils.toArray('.story__stage', story);
  if (stages.length < 2) return; // nothing to sequence

  // Only pin/crossfade when motion is allowed and the viewport is wide
  // enough that a multi-beat pinned section won't feel like the page
  // froze under mobile momentum-scroll (matches the 700px breakpoint
  // already used throughout style.css).
  const mm = gsap.matchMedia();

  mm.add('(min-width: 700px) and (prefers-reduced-motion: no-preference)', () => {
    story.classList.add('story--pinned');

    // Photo (bg+scrim) and copy fade on separate schedules: photos get a
    // wide, gentle crossfade (nice blend, no hard cut); copy text uses a
    // short, fully SEQUENTIAL fade — the outgoing headline finishes
    // disappearing before the next one starts — because two large serif
    // headlines overlapping mid-transition is unreadable, unlike photos
    // which blend fine.
    const FADE = 0.34;       // photo crossfade window (fraction of a slot)
    const TEXT_FADE = 0.14;  // each headline's own fade in/out duration
    const TEXT_GAP = 0.04;   // beat of photo-only time between outgoing/incoming copy
    const tl = gsap.timeline({ defaults: { ease: 'none' } });

    stages.forEach((stage, i) => {
      const visual = stage.querySelectorAll('.story__bg, .story__scrim');
      const copy = stage.querySelector('.story__copy');

      if (i === 0) {
        // First stage is visible immediately — no scroll required to see
        // the hero content, this section IS the hero.
        gsap.set(stage, { opacity: 1 });
        gsap.set(copy, { opacity: 1, y: 0 });
      } else {
        tl.fromTo(visual, { opacity: 0 }, { opacity: 1, duration: FADE }, i - FADE);
        tl.fromTo(copy, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: TEXT_FADE }, i + TEXT_GAP);
      }
      if (i < stages.length - 1) {
        tl.to(copy, { opacity: 0, y: -20, duration: TEXT_FADE }, (i + 1) - FADE - TEXT_GAP - TEXT_FADE);
        tl.to(visual, { opacity: 0, duration: FADE }, (i + 1) - FADE);
      }
    });

    const trigger = ScrollTrigger.create({
      animation: tl,
      trigger: story,
      start: 'top top',
      end: () => '+=' + stages.length * window.innerHeight,
      pin: true,
      anticipatePin: 1,
      scrub: 1,
      invalidateOnRefresh: true,
    });

    // Cleanup — runs automatically when the matchMedia query stops
    // matching (viewport narrows below 700px, or motion preference
    // changes mid-session).
    return () => {
      trigger.kill();
      story.classList.remove('story--pinned');
      gsap.set(stages, { clearProps: 'all' });
    };
  });

  // Recompute pin distances once fonts/images have actually laid out —
  // Fraunces/Albert Sans swapping in, and the stage background photos
  // loading, both change section heights.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
