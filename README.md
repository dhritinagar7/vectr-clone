# Vectr Clone

A scroll-driven 3D landing page demo built with **Three.js**, **GSAP ScrollTrigger**, and **Vite**. All 3D geometry is procedural — no external model files.

## Highlights

- Fixed fullscreen WebGL canvas with HTML content scrolling over it
- 456svh pinned "flow" section: four process steps drive camera keyframes, a self-drawing red tube path, a glowing blue beam with a traveling head light, a rounded-tile match grid, and an arrival arc with animated worker figures
- UnrealBloom post-processing tuned so only emissive surfaces glow
- Hero with 3D-perspective entrance, staggered feature reveals, FAQ accordion, dark CTA

## Run

```bash
npm install
npm run dev      # dev server
npm run build    # production build to dist/
```

## Structure

```
index.html            page markup (all sections)
src/main.js           boot + RAF loop
src/style.css         design tokens + section styles
src/scroll.js         GSAP ScrollTrigger orchestration
src/ui.js             FAQ accordion, scroll CTA
src/scene/stage.js    renderer, camera, lights, bloom composer
src/scene/city.js     procedural city, turbines, logistics zone
src/scene/paths.js    glowing red path + blue beam/arc
src/scene/props.js    dot grid, tile grid, worker figures
src/scene/cameraRig.js camera keyframes + tweens
```
