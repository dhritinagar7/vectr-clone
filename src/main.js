import './style.css'
import { createStage } from './scene/stage.js'
import { buildCity } from './scene/city.js'
import { createPaths } from './scene/paths.js'
import { createDotGrid, createTileGrid, createWorkers } from './scene/props.js'
import { createCameraRig } from './scene/cameraRig.js'
import { initScroll } from './scroll.js'
import { initUI } from './ui.js'

const canvas = document.getElementById('webgl')
const stage = createStage(canvas)

const city = buildCity(stage.scene)
const paths = createPaths(stage.scene)
const dotGrid = createDotGrid(stage.scene)
const tileGrid = createTileGrid(stage.scene)
const workers = createWorkers(stage.scene)
const rig = createCameraRig(stage.camera)

initUI()
initScroll({ rig, paths, dotGrid, tileGrid, workers })

if (import.meta.env.DEV) {
  window.__vectr = { stage, rig, paths }
}

function animate() {
  requestAnimationFrame(animate)
  const now = performance.now()

  rig.update()
  workers.update(now)

  // idle wind turbine spin
  for (const turbine of city.turbines.children) {
    turbine.userData.blades.rotation.z = now * 0.0012
  }

  stage.composer.render()
}
animate()
