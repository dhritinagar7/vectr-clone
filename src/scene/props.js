import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const _m = new THREE.Matrix4()
const _p = new THREE.Vector3()
const _q = new THREE.Quaternion()
const _s = new THREE.Vector3(1, 1, 1)

// --- Dot grid: 40x40 instanced flat circles on the ground ---
export function createDotGrid(scene) {
  const size = 40
  const spacing = 1.2
  const geometry = new THREE.CircleGeometry(0.06, 6)
  const material = new THREE.MeshBasicMaterial({
    color: 0x90b0d0,
    transparent: true,
    opacity: 0.2,
  })
  const mesh = new THREE.InstancedMesh(geometry, material, size * size)
  const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
  let i = 0
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      _p.set((x - size / 2) * spacing, 0.01, (z - size / 2) * spacing)
      _m.compose(_p, rot, _s)
      mesh.setMatrixAt(i++, _m)
    }
  }
  mesh.instanceMatrix.needsUpdate = true
  scene.add(mesh)

  return {
    mesh,
    setOpacity(o) {
      material.opacity = o
      mesh.visible = o > 0.001
    },
  }
}

// --- Tile grid: 12x10 rounded white tiles, one glowing blue in the center (step 2) ---
export function createTileGrid(scene) {
  const cols = 12
  const rows = 10
  const spacing = 2.0
  const geometry = new RoundedBoxGeometry(1.7, 0.5, 1.7, 4, 0.18)
  const material = new THREE.MeshStandardMaterial({
    color: 0xeef1f5,
    roughness: 0.6,
    metalness: 0.0,
    transparent: true,
    opacity: 0,
  })
  const centerIndex = { col: Math.floor(cols / 2), row: Math.floor(rows / 2) }
  const mesh = new THREE.InstancedMesh(geometry, material, cols * rows - 1)
  let i = 0
  let centerPos = new THREE.Vector3()
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      _p.set((c - cols / 2) * spacing, 0.25, (r - rows / 2) * spacing)
      if (c === centerIndex.col && r === centerIndex.row) {
        centerPos = _p.clone()
        continue
      }
      _m.compose(_p, _q.identity(), _s)
      mesh.setMatrixAt(i++, _m)
    }
  }
  mesh.instanceMatrix.needsUpdate = true
  mesh.visible = false
  scene.add(mesh)

  const matchedMat = new THREE.MeshStandardMaterial({
    color: 0x2266ff,
    emissive: 0x4488ff,
    emissiveIntensity: 3.0,
    roughness: 0.3,
    transparent: true,
    opacity: 0,
  })
  const matchedTile = new THREE.Mesh(geometry, matchedMat)
  matchedTile.position.copy(centerPos)
  matchedTile.visible = false
  scene.add(matchedTile)

  return {
    mesh,
    matchedTile,
    matchedPosition: centerPos,
    setOpacity(o) {
      material.opacity = o
      matchedMat.opacity = o
      mesh.visible = o > 0.001
      matchedTile.visible = o > 0.001
    },
  }
}

// --- Workers: low-poly humanoids from instanced primitives ---
const WORKER_SPOTS = [
  [6.2, 0, 4.2], [6.9, 0, 3.6], [5.4, 0, 5.0], [7.6, 0, 4.6],
  [8.4, 0, 5.4], [4.8, 0, 4.0], [9.2, 0, 6.2], [5.8, 0, 6.0],
  [7.2, 0, 6.6], [8.8, 0, 3.4],
]

export function createWorkers(scene) {
  const count = WORKER_SPOTS.length
  const material = new THREE.MeshStandardMaterial({
    color: 0xbbc8d4,
    roughness: 0.9,
    transparent: true,
    opacity: 0,
  })

  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 12, 12), material, count)
  const bodies = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.12, 0.4, 10), material, count)
  const arms = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), material, count * 2)

  const group = new THREE.Group()
  group.add(heads, bodies, arms)
  group.visible = false
  scene.add(group)

  const armRotL = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 4))
  const armRotR = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 4))

  function layout(time) {
    for (let i = 0; i < count; i++) {
      const [x, , z] = WORKER_SPOTS[i]
      const bob = Math.sin(time * 0.002 + i * 0.8) * 0.05

      _p.set(x, 0.72 + bob, z)
      _m.compose(_p, _q.identity(), _s)
      heads.setMatrixAt(i, _m)

      _p.set(x, 0.42 + bob, z)
      _m.compose(_p, _q.identity(), _s)
      bodies.setMatrixAt(i, _m)

      _p.set(x - 0.16, 0.46 + bob, z)
      _m.compose(_p, armRotL, _s)
      arms.setMatrixAt(i * 2, _m)

      _p.set(x + 0.16, 0.46 + bob, z)
      _m.compose(_p, armRotR, _s)
      arms.setMatrixAt(i * 2 + 1, _m)
    }
    heads.instanceMatrix.needsUpdate = true
    bodies.instanceMatrix.needsUpdate = true
    arms.instanceMatrix.needsUpdate = true
  }
  layout(0)

  return {
    group,
    setOpacity(o) {
      material.opacity = o
      group.visible = o > 0.001
    },
    update(time) {
      if (group.visible) layout(time)
    },
  }
}
