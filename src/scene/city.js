import * as THREE from 'three'

// Deterministic PRNG so the city layout is stable across reloads
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const buildingMat = new THREE.MeshStandardMaterial({
  color: 0xdce3ea,
  roughness: 0.8,
  metalness: 0.0,
})
const lightMat = new THREE.MeshStandardMaterial({
  color: 0xd8dfe8,
  roughness: 0.8,
  metalness: 0.0,
})
const containerMat = new THREE.MeshStandardMaterial({
  color: 0xc8d0d8,
  roughness: 0.7,
  metalness: 0.0,
})
const detailMat = new THREE.MeshStandardMaterial({
  color: 0xc2ccd6,
  roughness: 0.9,
  metalness: 0.0,
})

function steppedBuilding(rng, baseW, baseD, maxH) {
  const group = new THREE.Group()
  const tiers = 1 + Math.floor(rng() * 3)
  let y = 0
  let w = baseW
  let d = baseD
  for (let i = 0; i < tiers; i++) {
    const h = (maxH / tiers) * (0.7 + rng() * 0.6)
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), i % 2 ? lightMat : buildingMat)
    box.position.y = y + h / 2
    group.add(box)
    y += h
    w *= 0.65 + rng() * 0.2
    d *= 0.65 + rng() * 0.2
  }
  // rooftop details: AC units + antenna
  if (rng() > 0.4) {
    const ac = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), detailMat)
    ac.position.set((rng() - 0.5) * w * 0.5, y + 0.075, (rng() - 0.5) * d * 0.5)
    group.add(ac)
  }
  if (rng() > 0.6) {
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), detailMat)
    antenna.position.set(0, y + 0.4, 0)
    group.add(antenna)
  }
  return group
}

function windTurbine() {
  const group = new THREE.Group()
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 4.2, 8), lightMat)
  shaft.position.y = 2.1
  group.add(shaft)
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), lightMat)
  hub.position.y = 4.2
  group.add(hub)
  // rotor disc faces local +z; spin around z reads as a propeller
  const blades = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.5, 6), lightMat)
    blade.position.y = 0.75
    const arm = new THREE.Group()
    arm.add(blade)
    arm.rotation.z = (i / 3) * Math.PI * 2
    blades.add(arm)
  }
  blades.position.set(0, 4.2, 0.12)
  group.add(blades)
  group.userData.blades = blades
  return group
}

function coolingTower() {
  // hyperboloid-ish silhouette via lathe profile
  const points = []
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    const r = 1.0 - 0.55 * Math.sin(t * Math.PI * 0.78)
    points.push(new THREE.Vector2(r * 1.2, t * 3.2))
  }
  const tower = new THREE.Mesh(new THREE.LatheGeometry(points, 20), buildingMat)
  return tower
}

export function buildCity(scene) {
  const rng = mulberry32(20260612)
  const root = new THREE.Group()

  // --- Zone A: dense city block around the origin (step 0) ---
  // Streets are kept clear along x = -8, z = -2, x = 0, z = -8 (the red path route)
  const cityZone = new THREE.Group()
  for (let gx = -6; gx <= 3; gx++) {
    for (let gz = -5; gz <= 4; gz++) {
      const x = gx * 2.2
      const z = gz * 2.2
      const streetDist = Math.min(
        Math.abs(x - -8), Math.abs(x),
        Math.abs(z - -2), Math.abs(z - -8)
      )
      if (streetDist < 1.5) continue
      // keep blocks bordering the glowing-path corridors low so the path reads
      const heightCap = streetDist < 3 ? 1.8 : 4.5
      const b = steppedBuilding(rng, 1.2 + rng() * 0.7, 1.2 + rng() * 0.7, 1.5 + rng() * heightCap)
      b.position.set(x + (rng() - 0.5) * 0.4, 0, z + (rng() - 0.5) * 0.4)
      cityZone.add(b)
    }
  }
  root.add(cityZone)

  // --- Zone B: medical/office building with blue emblem (step 1 focus) ---
  const medical = new THREE.Group()
  const medBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 2.2), buildingMat)
  medBody.position.y = 1.6
  medical.add(medBody)
  const medWing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.8), lightMat)
  medWing.position.set(1.9, 0.9, 0.2)
  medical.add(medWing)
  const emblem = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.9),
    new THREE.MeshStandardMaterial({
      color: 0x3932dc,
      emissive: 0x3932dc,
      emissiveIntensity: 1.2,
      roughness: 0.4,
    })
  )
  emblem.position.set(0, 2.4, 1.101)
  medical.add(emblem)
  medical.position.set(-2, 0, -3)
  root.add(medical)

  // --- Zone B background: wind turbines to the right ---
  const turbines = new THREE.Group()
  const turbinePositions = [
    [9, 0, -14], [12.5, 0, -16], [16, 0, -13], [13, 0, -10.5],
  ]
  for (const [x, y, z] of turbinePositions) {
    const t = windTurbine()
    t.position.set(x, y, z)
    t.rotation.y = 0.9 + rng() * 0.5
    t.scale.setScalar(0.8 + rng() * 0.4)
    turbines.add(t)
  }
  root.add(turbines)

  // Cooling towers far back-left, mostly swallowed by fog
  const tower1 = coolingTower()
  tower1.position.set(-22, 0, -20)
  root.add(tower1)
  const tower2 = coolingTower()
  tower2.position.set(-18, 0, -24)
  tower2.scale.setScalar(0.8)
  root.add(tower2)

  // --- Zone C: logistics / construction site (step 3 focus, around (4..12, 0..8)) ---
  const logistics = new THREE.Group()

  const warehouse1 = new THREE.Mesh(new THREE.BoxGeometry(5, 1.8, 3), buildingMat)
  warehouse1.position.set(7, 0.9, 5)
  logistics.add(warehouse1)
  const warehouseRoof = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.2, 3.4), lightMat)
  warehouseRoof.position.set(7, 1.9, 5)
  logistics.add(warehouseRoof)

  const warehouse2 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 2.4), buildingMat)
  warehouse2.position.set(12, 0.7, 2.5)
  logistics.add(warehouse2)

  // shipping container grid
  for (let cx = 0; cx < 4; cx++) {
    for (let cz = 0; cz < 3; cz++) {
      if (rng() > 0.85) continue
      const c = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 0.5), containerMat)
      c.position.set(9.5 + cx * 1.3, 0.225 + (rng() > 0.75 ? 0.45 : 0), 7.2 + cz * 0.7)
      logistics.add(c)
    }
  }

  // crude construction vehicles: cab + body + arm boxes
  for (const [vx, vz, rot] of [[4.5, 6.5, 0.5], [11, 4.8, -1.2]]) {
    const vehicle = new THREE.Group()
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.5), containerMat)
    body.position.y = 0.3
    vehicle.add(body)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.4), detailMat)
    cab.position.set(-0.2, 0.6, 0)
    vehicle.add(cab)
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.12), detailMat)
    arm.position.set(0.5, 0.65, 0)
    arm.rotation.z = 0.5
    vehicle.add(arm)
    vehicle.position.set(vx, 0, vz)
    vehicle.rotation.y = rot
    logistics.add(vehicle)
  }
  root.add(logistics)

  // Ground plane
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(70, 48),
    new THREE.MeshStandardMaterial({ color: 0xdde6ee, roughness: 1.0, metalness: 0 })
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.01
  root.add(ground)

  scene.add(root)
  return { root, cityZone, medical, turbines, logistics }
}
