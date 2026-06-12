import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    logarithmicDepthBuffer: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight, false)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.shadowMap.enabled = false

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xd9e8f1)
  scene.fog = new THREE.Fog(0xdce8f2, 30, 80)

  const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  )
  camera.position.set(12, 18, 22)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.0)
  dirLight.position.set(10, 20, 10)
  scene.add(dirLight)

  const fillLight = new THREE.DirectionalLight(0xd0e8f8, 0.6)
  fillLight.position.set(-10, 5, -10)
  scene.add(fillLight)

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  // threshold sits above lit white surfaces so only emissive paths bloom
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    1.1
  )
  composer.addPass(bloomPass)
  composer.addPass(new OutputPass())

  function resize() {
    const width = window.innerWidth
    const height = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio, 2)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height, false)
    composer.setPixelRatio(dpr)
    composer.setSize(width, height)
  }
  window.addEventListener('resize', resize)

  return { renderer, scene, camera, composer, bloomPass, resize }
}
