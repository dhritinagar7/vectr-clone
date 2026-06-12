import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Keep tweens in sync with scroll position even on slow frames
gsap.ticker.lagSmoothing(0)

// Per-step scene targets, lerped between as the user scrubs
const STEP_SCENE = [
  { dotOpacity: 0.2, redOpacity: 1, beamOpacity: 0, tileOpacity: 0, workerOpacity: 0 },
  { dotOpacity: 0.5, redOpacity: 0, beamOpacity: 1, tileOpacity: 0, workerOpacity: 0 },
  { dotOpacity: 0.5, redOpacity: 0, beamOpacity: 1, tileOpacity: 1, workerOpacity: 0 },
  { dotOpacity: 0.5, redOpacity: 0, beamOpacity: 1, tileOpacity: 0, workerOpacity: 1 },
]

export function initScroll({ rig, paths, dotGrid, tileGrid, workers }) {
  const heroEl = document.getElementById('hero')
  const stepEls = Array.from(document.querySelectorAll('.flow__step'))
  const fillEls = stepEls.map((el) => el.querySelector('.flow__track-fill'))

  const state = { step: 0, stepProgress: 0 }

  // Hero entrance, then hide/show on scroll past the spacer.
  // The spacer is the first in-flow element, so an element-based start
  // resolves to a negative scroll position — use a plain scroll offset.
  const showHero = () => {
    heroEl.classList.remove('hide')
    heroEl.classList.add('show')
  }
  const hideHero = () => {
    heroEl.classList.remove('show')
    heroEl.classList.add('hide')
  }
  setTimeout(() => {
    if (!heroEl.classList.contains('hide')) heroEl.classList.add('show')
  }, 100)

  ScrollTrigger.create({
    start: () => window.innerHeight * 0.3,
    end: () => ScrollTrigger.maxScroll(window),
    onEnter: hideHero,
    onLeaveBack: showHero,
  })

  const sceneTweenTargets = { ...STEP_SCENE[0] }

  function applySceneState(s) {
    dotGrid.setOpacity(s.dotOpacity)
    paths.setRedOpacity(s.redOpacity)
    tileGrid.setOpacity(s.tileOpacity)
    workers.setOpacity(s.workerOpacity)
    // Beam head travel: draws across step 1, holds at the matched tile during
    // step 2, then rides the arrival arc in step 3
    paths.setBeamState({
      opacity: s.beamOpacity,
      progress:
        state.step === 1 ? state.stepProgress
        : state.step === 2 ? 1
        : state.step === 3 ? state.stepProgress
        : 0,
      useArc: state.step === 3,
    })
  }
  applySceneState(sceneTweenTargets)

  function activateStep(index, progress) {
    state.stepProgress = progress

    // Track-fill scrub on the active step
    if (fillEls[index]) gsap.set(fillEls[index], { scaleY: progress })

    // Red path draws itself during step 0
    if (index === 0) paths.setRedProgress(progress)
    else paths.setRedProgress(1)

    applySceneState(sceneTweenTargets)

    if (index === state.step) return
    state.step = index

    // Step UI: collapse previous, expand current
    stepEls.forEach((el, i) => el.classList.toggle('flow__step--active', i === index))
    fillEls.forEach((el, i) => {
      if (i < index) gsap.set(el, { scaleY: 1 })
      if (i > index) gsap.set(el, { scaleY: 0 })
    })

    rig.tweenToStep(index)

    gsap.to(sceneTweenTargets, {
      ...STEP_SCENE[index],
      duration: 1.0,
      ease: 'power2.inOut',
      overwrite: 'auto',
      onUpdate: () => applySceneState(sceneTweenTargets),
    })
  }

  // Flow section — master scrub
  ScrollTrigger.create({
    trigger: '.flow',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
    onUpdate: (self) => {
      const progress = self.progress
      const stepIndex = Math.min(3, Math.floor(progress * 4))
      const stepProgress = Math.min(1, (progress * 4) % 1 || (progress === 1 ? 1 : 0))
      activateStep(stepIndex, stepProgress)
    },
  })

  // Initial step state
  stepEls[0].classList.add('flow__step--active')

  // Features: dark overlay over the canvas + staggered card reveal
  gsap.to('.scene-overlay', {
    opacity: 0.85,
    ease: 'none',
    scrollTrigger: {
      trigger: '.features',
      start: 'top bottom',
      end: 'top top',
      scrub: true,
    },
  })

  gsap.set('.feature-card', { opacity: 0, y: 20 })
  gsap.to('.feature-card', {
    opacity: 1,
    y: 0,
    stagger: 0.25,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.features',
      start: 'top top',
      end: '+=200%',
      scrub: 0.5,
    },
  })

  gsap.set('.features__title', { opacity: 0, y: 30 })
  gsap.to('.features__title', {
    opacity: 1,
    y: 0,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.features',
      start: 'top 40%',
      end: 'top top',
      scrub: 0.5,
    },
  })

  return state
}
