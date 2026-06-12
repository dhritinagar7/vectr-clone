import * as THREE from 'three'

// Red grid path: 4 parallel tubes drawing themselves through the city streets
const RED_WAYPOINTS = [
  [-8, 0.2, 8],
  [-8, 0.2, -2],
  [0, 0.2, -2],
  [0, 0.2, -8],
  [4, 0.2, -8],
]

export function createPaths(scene) {
  // --- Red path (step 0) ---
  const redGroup = new THREE.Group()
  const redTubes = []
  for (let i = 0; i < 4; i++) {
    const offset = (i - 1.5) * 0.3
    const points = RED_WAYPOINTS.map(
      ([x, y, z]) => new THREE.Vector3(x + offset, y, z + offset)
    )
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.05)
    const geometry = new THREE.TubeGeometry(curve, 200, 0.09, 8, false)
    const material = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      emissive: 0xff1111,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 1,
    })
    const tube = new THREE.Mesh(geometry, material)
    geometry.setDrawRange(0, 0)
    redGroup.add(tube)
    redTubes.push(tube)
  }
  scene.add(redGroup)

  const redIndexCount = redTubes[0].geometry.index.count

  function setRedProgress(t) {
    const count = Math.floor(THREE.MathUtils.clamp(t, 0, 1) * redIndexCount)
    for (const tube of redTubes) tube.geometry.setDrawRange(0, count)
  }

  function setRedOpacity(o) {
    redGroup.visible = o > 0.001
    for (const tube of redTubes) tube.material.opacity = o
  }

  // --- Blue beam (steps 1-2): from the medical building entrance out to scene center ---
  const beamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2, 1.2, -1.9),
    new THREE.Vector3(-1, 1.8, 0.5),
    new THREE.Vector3(0.5, 1.4, 2.5),
    new THREE.Vector3(0, 0.6, 0),
  ])
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x2266ff,
    emissive: 0x4488ff,
    emissiveIntensity: 4.0,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0,
  })
  const beam = new THREE.Mesh(new THREE.TubeGeometry(beamCurve, 120, 0.12, 10, false), beamMat)
  beam.visible = false
  scene.add(beam)
  const beamIndexCount = beam.geometry.index.count

  // --- Arrival arc (step 3): curved route into the logistics site ---
  const arcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.6, 0),
    new THREE.Vector3(2, 2.6, 2),
    new THREE.Vector3(4.5, 2.2, 4),
    new THREE.Vector3(7, 0.3, 5.2),
  ])
  const arcMat = beamMat.clone()
  arcMat.opacity = 0
  const arc = new THREE.Mesh(new THREE.TubeGeometry(arcCurve, 120, 0.12, 10, false), arcMat)
  arc.visible = false
  scene.add(arc)
  const arcIndexCount = arc.geometry.index.count

  // --- Beam head: glowing sphere + point light travelling along the active curve ---
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      emissive: 0x66aaff,
      emissiveIntensity: 5.0,
      roughness: 0.1,
      transparent: true,
      opacity: 0,
    })
  )
  head.visible = false
  scene.add(head)

  const headLight = new THREE.PointLight(0x4488ff, 8, 12)
  headLight.visible = false
  scene.add(headLight)

  function setBeamState({ opacity, progress, useArc }) {
    const activeCurve = useArc ? arcCurve : beamCurve
    const t = THREE.MathUtils.clamp(progress, 0.0001, 1)

    beam.visible = !useArc && opacity > 0.001
    beamMat.opacity = useArc ? 0 : opacity * 0.9
    beam.geometry.setDrawRange(0, Math.floor(t * beamIndexCount))

    arc.visible = useArc && opacity > 0.001
    arcMat.opacity = useArc ? opacity * 0.9 : 0
    arc.geometry.setDrawRange(0, Math.floor(t * arcIndexCount))

    const visible = opacity > 0.001
    head.visible = visible
    head.material.opacity = opacity
    headLight.visible = visible
    headLight.intensity = 8 * opacity

    const pos = activeCurve.getPointAt(t)
    head.position.copy(pos)
    headLight.position.copy(pos)
  }

  return { setRedProgress, setRedOpacity, setBeamState, beamCurve, arcCurve }
}
