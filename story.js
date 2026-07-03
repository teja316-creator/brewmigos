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

    const dots = gsap.utils.toArray('.story__rail-dot', story);

    // Image and copy fade on separate schedules: the photo card gets a
    // wide, gentle crossfade (nice blend, no hard cut); copy text uses a
    // short, fully SEQUENTIAL fade — the outgoing headline finishes
    // disappearing before the next one starts — because two headlines
    // overlapping mid-transition is unreadable, unlike photos which
    // blend fine. The rail dot lights up on the same schedule as its
    // chapter's text, so the "guide" actually tracks reading progress.
    const FADE = 0.34;       // image crossfade window (fraction of a slot)
    const TEXT_FADE = 0.14;  // each headline's own fade in/out duration
    const TEXT_GAP = 0.04;   // beat of image-only time between outgoing/incoming copy
    // duration must match TEXT_FADE explicitly — without it GSAP falls
    // back to its own default (0.5), badly out of sync with the text
    // fade and inflating the timeline's total length past where the
    // text/image tweens actually end.
    const DOT_ON  = { scale: 1.6, backgroundColor: '#C98A3C', duration: TEXT_FADE };
    const DOT_OFF = { scale: 1,   backgroundColor: 'rgba(201,138,60,0.3)', duration: TEXT_FADE };
    const tl = gsap.timeline({ defaults: { ease: 'none' } });

    stages.forEach((stage, i) => {
      const media = stage.querySelector('.story__media');
      const copy = stage.querySelector('.story__copy');
      const dot = dots[i];

      if (i === 0) {
        // First stage is visible immediately — no scroll required to see
        // the hero content, this section IS the hero.
        gsap.set(stage, { opacity: 1 });
        gsap.set(copy, { opacity: 1, y: 0 });
        gsap.set(dot, DOT_ON);
      } else {
        tl.fromTo(media, { opacity: 0 }, { opacity: 1, duration: FADE }, i - FADE);
        tl.fromTo(copy, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: TEXT_FADE }, i + TEXT_GAP);
        tl.to(dot, DOT_ON, i + TEXT_GAP);
      }
      if (i < stages.length - 1) {
        tl.to(copy, { opacity: 0, y: -20, duration: TEXT_FADE }, (i + 1) - FADE - TEXT_GAP - TEXT_FADE);
        tl.to(media, { opacity: 0, duration: FADE }, (i + 1) - FADE);
        tl.to(dot, DOT_OFF, (i + 1) - FADE - TEXT_GAP - TEXT_FADE);
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
      gsap.set(dots, { clearProps: 'all' });
    };
  });

  // Recompute pin distances once fonts/images have actually laid out —
  // Fraunces/Albert Sans swapping in, and the stage background photos
  // loading, both change section heights.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
