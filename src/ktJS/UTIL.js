import { STATE } from './STATE.js'
import { CACHE } from './CACHE.js'
import { DATA } from './DATA.js'
import { API } from './API.js'

// 相机动画（传指定state）
function cameraAnimation({ cameraState, callback, delayTime = 0, duration = 800 }) {
  const targetPos = new Bol3D.Vector3()
  const pos = new Bol3D.Vector3()
  targetPos.set(cameraState.target.x, cameraState.target.y, cameraState.target.z)
  pos.set(cameraState.position.x, cameraState.position.y, cameraState.position.z)

  if (targetPos.distanceTo(CACHE.container.orbitControls.target) < 0.1 && pos.distanceTo(CACHE.container.orbitControls.object.position) < 0.1) {
    callback && callback()
    return
  }

  CACHE.container.orbitControls.enabled = false
  let count = 0

  const t1 = new Bol3D.TWEEN.Tween(CACHE.container.orbitCamera.position)
    .to(
      {
        x: cameraState.position.x,
        y: cameraState.position.y,
        z: cameraState.position.z
      },
      duration
    )
    .easing(Bol3D.TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => { })
    .onComplete(() => {
      count++

      if (count == 2) {
        CACHE.container.orbitControls.enabled = true
        callback && callback()
      }
    })


  const t2 = new Bol3D.TWEEN.Tween(CACHE.container.orbitControls.target)
    .to(
      {
        x: cameraState.target.x,
        y: cameraState.target.y,
        z: cameraState.target.z
      },
      duration
    )
    .easing(Bol3D.TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => { })
    .onComplete(() => {
      count++
      if (count == 2) {
        CACHE.container.orbitControls.enabled = true
        callback && callback()
      }
    })

  t1.delay(delayTime).start()
  t2.delay(delayTime).start()

  return t1
}


function loadGUI() {
  // gui
  const gui = new dat.GUI()
  // default opts
  const deafultsScene = { distance: 8000, }
  // scenes
  const scenesFolder = gui.addFolder('场景')
  // toneMapping
  scenesFolder.add(CACHE.container.renderer, 'toneMappingExposure', 0, 10).step(0.001).name('exposure')
  scenesFolder.add(CACHE.container.ambientLight, 'intensity').step(0.1).min(0).max(10).name('环境光强度')
  scenesFolder.add(CACHE.container.gammaPass, 'enabled').name('gamma校正')
  scenesFolder
    .addColor(CACHE.container.attrs.lights.directionLights[0], 'color')
    .onChange((val) => {
      CACHE.container.directionLights[0].color.set(val)
    })
    .name('平行光颜色')
  scenesFolder.add(CACHE.container.directionLights[0].position, 'x')
  scenesFolder.add(CACHE.container.directionLights[0].position, 'y')
  scenesFolder.add(CACHE.container.directionLights[0].position, 'z')
  scenesFolder.add(deafultsScene, 'distance').onChange((val) => {
    CACHE.container.directionLights[0].shadow.camera.left = -val
    CACHE.container.directionLights[0].shadow.camera.right = val
    CACHE.container.directionLights[0].shadow.camera.top = val
    CACHE.container.directionLights[0].shadow.camera.bottom = -val
    CACHE.container.directionLights[0].shadow.camera.updateProjectionMatrix()
    CACHE.container.directionLights[0].shadow.needsUpdate = true
  })
  scenesFolder.add(CACHE.container.directionLights[0].shadow.camera, 'far').onChange(() => {
    CACHE.container.directionLights[0].shadow.camera.updateProjectionMatrix()
    CACHE.container.directionLights[0].shadow.needsUpdate = true
  })
  scenesFolder.add(CACHE.container.directionLights[0].shadow.camera, 'near').onChange(() => {
    CACHE.container.directionLights[0].shadow.camera.updateProjectionMatrix()
    CACHE.container.directionLights[0].shadow.needsUpdate = true
  })
  scenesFolder
    .add(CACHE.container.directionLights[0].shadow, 'bias')
    .step(0.0001)
    .onChange(() => {
      CACHE.container.directionLights[0].shadow.needsUpdate = true
    })
  scenesFolder.add(CACHE.container.directionLights[0], 'intensity').step(0.1).min(0).max(10)

  // filter pass
  const filterFolder = gui.addFolder('滤镜')
  const defaultsFilter = {
    hue: 0,
    saturation: 1,
    vibrance: 0,
    brightness: 0,
    contrast: 1
  }
  filterFolder.add(CACHE.container.filterPass, 'enabled')
  filterFolder
    .add(defaultsFilter, 'hue')
    .min(0)
    .max(1)
    .step(0.01)
    .onChange((val) => {
      CACHE.container.filterPass.filterMaterial.uniforms.hue.value = val
    })
  filterFolder
    .add(defaultsFilter, 'saturation')
    .min(0)
    .max(1)
    .step(0.01)
    .onChange((val) => {
      CACHE.container.filterPass.filterMaterial.uniforms.saturation.value = val
    })
  filterFolder
    .add(defaultsFilter, 'vibrance')
    .min(0)
    .max(10)
    .step(0.01)
    .onChange((val) => {
      CACHE.container.filterPass.filterMaterial.uniforms.vibrance.value = val
    })

  filterFolder
    .add(defaultsFilter, 'brightness')
    .min(0)
    .max(1)
    .step(0.01)
    .onChange((val) => {
      CACHE.container.filterPass.filterMaterial.uniforms.brightness.value = val
    })
  filterFolder
    .add(defaultsFilter, 'contrast')
    .min(0)
    .max(1)
    .step(0.01)
    .onChange((val) => {
      CACHE.container.filterPass.filterMaterial.uniforms.contrast.value = val
    })


}

// 将模型添加到clickObjects（visible为false的不添加）
function setPickable(model, evt) {
  const container = evt !== undefined ? evt : CACHE.container
  if (!model.visible) return
  if (model.isMesh) container.clickObjects.push(model)
  if (model.children && model.children.length > 0) {
    model.children.forEach((child) => {
      setPickable(child, container)
    })
  }
}


/**
 * 设置模型位置(position)，旋转(rotation)，缩放(scale),有该属性的物体亦可
 * @param {object} mesh 待操作模型
 */
function setModelPosition(mesh) {
  const controls = CACHE.container.transformControl;
  const gui = new dat.GUI();
  const options = {
    transformModel: "translate"
  };
  gui.add(options, 'transformModel', ["translate", 'rotate', 'scale']).onChange(val => controls.setMode(val));
  const positionX = gui.add(mesh.position, 'x').onChange(val => mesh.position.x = val).name('positionX');
  const positionY = gui.add(mesh.position, 'y').onChange(val => mesh.position.y = val).name('positionY');
  const positionZ = gui.add(mesh.position, 'z').onChange(val => mesh.position.z = val).name('positionZ');
  const rotationX = gui.add(mesh.rotation, 'x').step(0.01).onChange(val => mesh.rotation.x = val).name('rotationX');
  const rotationY = gui.add(mesh.rotation, 'y').step(0.01).onChange(val => mesh.rotation.y = val).name('rotationY');
  const rotationZ = gui.add(mesh.rotation, 'z').step(0.01).onChange(val => mesh.rotation.z = val).name('rotationZ');
  const scaleX = gui.add(mesh.scale, "x").step(0.1).onChange(val => mesh.scale.x = val).name('scaleX');
  const scaleY = gui.add(mesh.scale, "y").step(0.1).onChange(val => mesh.scale.y = val).name('scaleY');
  const scaleZ = gui.add(mesh.scale, "z").step(0.1).onChange(val => mesh.scale.z = val).name('scaleZ');
  controls.attach(mesh);

  controls.addEventListener("change", (e) => {
    positionX.setValue(mesh.position.x);
    positionY.setValue(mesh.position.y);
    positionZ.setValue(mesh.position.z);
    rotationX.setValue(mesh.rotation.x);
    rotationY.setValue(mesh.rotation.y);
    rotationZ.setValue(mesh.rotation.z);
    scaleX.setValue(mesh.scale.x);
    scaleY.setValue(mesh.scale.y);
    scaleZ.setValue(mesh.scale.z);
  });
}


// 单模型实例化
function instantiationSingleInfo(identicalMeshArray, name) {
  identicalMeshArray.forEach((item) => {
    const instanceName = name
    if (!CACHE.instanceTransformInfo[instanceName]) {
      CACHE.instanceTransformInfo[instanceName] = []
    }

    let p = new Bol3D.Vector3()
    let s = new Bol3D.Vector3()
    let q = new Bol3D.Quaternion()


    item.getWorldPosition(p)
    item.getWorldScale(s)
    item.getWorldQuaternion(q)

    CACHE.instanceTransformInfo[instanceName].push({
      position: p,
      quaternion: q,
      scale: s,
    })

    if (!CACHE.instanceMeshInfo[instanceName]) {
      CACHE.instanceMeshInfo[instanceName] = {
        material: item.material.clone(),
        geometry: item.geometry.clone()
      }
    }

    if (!CACHE.removed[item.uuid]) CACHE.removed[item.uuid] = item;


    setTimeout(() => {
      item.geometry.dispose()
      if (item.material.map) {
        item.material.map.dispose()
        item.material.map = null
      }
      item.material.dispose()
      item = null
    }, 0)
  })
}

// 实例化生成
function instanceInit() {
  // remove unused obj3d
  for (const i in CACHE.removed) {
    const removed = CACHE.removed[i];
    if (removed.parent) {
      removed.parent.remove(removed);
    }
  }

  // instance
  for (const key in CACHE.instanceMeshInfo) {
    const { geometry, material } = CACHE.instanceMeshInfo[key];
    const count = CACHE.instanceTransformInfo[key].length;
    const instanceMesh = new Bol3D.InstancedMesh(geometry, material, count);
    instanceMesh.castShadow = true
    instanceMesh.receiveShadow = true
    const matrix = new Bol3D.Matrix4();
    for (let i = 0; i < count; i++) {
      const { position, quaternion, scale } = CACHE.instanceTransformInfo[key][i]
      matrix.compose(position, quaternion, scale)
      instanceMesh.setMatrixAt(i, matrix)
    }
    STATE.sceneList[key] = instanceMesh

    if (key === 'tree1') {
      instanceMesh.material.aoMapIntensity = 0.5
      instanceMesh.material.color = new Bol3D.Color(0.9, 1.5, 1.05)

    } else if (key === 'tree2') {
      instanceMesh.material.color = new Bol3D.Color(0.8, 0.8, 1)

    }

    CACHE.container.scene.add(instanceMesh)
  }
}


// 计算相机到目标指定长度的位置
function getCameraToTargetPosition(target = new Bol3D.Vector3(0, 0, 0), distance = 1000) {
  const direction = new Bol3D.Vector3()
  direction.subVectors(CACHE.container.orbitCamera.position, target)
  direction.normalize()

  const offset = direction.clone().multiplyScalar(distance)

  const newPosition = new Bol3D.Vector3()
  newPosition.addVectors(target, offset)

  return newPosition
}


// 计算世界坐标
function getWorldPosition(object) {
  const worldP = new Bol3D.Vector3()
  const worldS = new Bol3D.Vector3()
  const worldQ = new Bol3D.Quaternion()

  object.getWorldPosition(worldP)
  object.getWorldScale(worldS)
  object.getWorldQuaternion(worldQ)

  return {
    position: worldP,
    scale: worldS,
    quaternion: worldQ
  }
}


// DFS寻路算法
function findPath(start, end, visited = []) {
  
  const pathGraph = DATA.pathGraph
  if (start === end) {
    return [end]
  }
  visited.push(start)

  if (!pathGraph[start]) {
    console.error(start + ' 在图中无映射')
    return []
  }

  for (const neighbor of pathGraph[start]) {
    if (!visited.includes(neighbor)) {
      const path = findPath(neighbor, end, visited.slice())
      if (path.length > 0) {
        path.unshift(start)
        return path
      }
    }
  }

  return []
}


export const UTIL = {
  cameraAnimation,
  loadGUI,
  setPickable,
  instantiationSingleInfo,
  setModelPosition,
  instanceInit,
  getCameraToTargetPosition,
  getWorldPosition,
  findPath
}
window.UTIL = UTIL;