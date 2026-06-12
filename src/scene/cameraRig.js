import * as THREE from 'three'
import gsap from 'gsap'

const KEYFRAMES = [
  { position: [10, 24, 18], target: [-1, 0, -1] }, // step 0: bird's-eye city view
  { position: [5, 10, 14], target: [-2, 0, -3] },  // step 1: zoomed toward medical building
  { position: [0, 28, 20], target: [0, 0, 0] },    // step 2: pulled back to see tile grid
  { position: [16, 12, 18], target: [4, 0, 2] },   // step 3: wide logistics site view
]

export function createCameraRig(camera) {
  const target = new THREE.Vector3(...KEYFRAMES[0].target)
  camera.position.set(...KEYFRAMES[0].position)
  camera.lookAt(target)

  let currentStep = 0

  function tweenToStep(index) {
    if (index === currentStep) return
    currentStep = index
    const kf = KEYFRAMES[index]
    gsap.to(camera.position, {
      x: kf.position[0],
      y: kf.position[1],
      z: kf.position[2],
      duration: 1.2,
      ease: 'power2.inOut',
      overwrite: 'auto',
    })
    gsap.to(target, {
      x: kf.target[0],
      y: kf.target[1],
      z: kf.target[2],
      duration: 1.2,
      ease: 'power2.inOut',
      overwrite: 'auto',
    })
  }

  function update() {
    camera.lookAt(target)
  }

  return { tweenToStep, update, target }
}
