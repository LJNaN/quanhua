import { STATE } from './STATE.js'
import { CACHE } from './CACHE.js'
import { DATA } from './DATA.js'
import { UTIL } from './UTIL.js'
import { SimplifyModifier } from '@/assets/js/SimplifyModifier.js';
import * as TWEEN from '@tweenjs/tween.js'



// 处理 progress 中加载的模型
function handleInitModel(model, evt) {
  STATE.sceneList[model.name] = model

  if (model.name === 'WJ') {
    const treeArr = model.children.filter(e => e.name.includes('Shu_'))
    treeArr.forEach(e => {
      e.parent.remove(e)
      e.scale.set(DATA.sceneScale / 2, DATA.sceneScale / 2, DATA.sceneScale / 2)
      e.position.set(e.position.x * DATA.sceneScale, e.position.y * DATA.sceneScale, e.position.z * DATA.sceneScale)
    })
    CACHE.originTreeArr = treeArr

    model.children.forEach(e => {
      // 外场景 211 房间的可点击 mesh
      if (e.name === '对象052' || e.name === 'Line530' || e.name === 'Line531' || e.name === '组012') {
        e.traverse(e2 => {
          if (e2.isMesh) {
            evt.clickObjects.push(e2)
            STATE.saveClickObjects.home.push(e2)
            e2.userData.building = '211'
          }
        })
      }

      // 外场景 201 房间的可点击 mesh
      if (e.name === '组009') {
        e.traverse(e2 => {
          if (e2.isMesh) {
            evt.clickObjects.push(e2)
            STATE.saveClickObjects.home.push(e2)
            e2.userData.building = '201'
          }
        })
      }
    })

  } else if (model.name === 'mainTree') {
  } else if (model.name === '201-v1' || model.name === '211-v1') {
    let name = model.name === '201-v1' ? '201' : '211'
    model.scale.set(20, 20, 20)
    model.children[0].children.forEach(e => {
      e.traverse(e2 => {
        e2.userData.floor = e.name.split('_')[1].toUpperCase()
        e2.userData.y = e.position.y
        if (e2.isMesh) {
          STATE.saveClickObjects[name].push(e2)
          e2.material.alphaToCoverage = true

          if(e2.name.includes('_Floor')) {
            e2.renderOrder = 1
          }
        }
      })
    })
  }
}

// 加载、实例化树
function initTree() {
  const treeArr1 = []
  const treeArr2 = []
  const singleTree = STATE.sceneList.singleTree.children[0].clone()

  const modifier = new SimplifyModifier()
  const mainTree = STATE.sceneList.mainTree.children[0].clone()
  const count = Math.floor(mainTree.geometry.attributes.position.count * 0.34)
  mainTree.geometry = modifier.modify(mainTree.geometry, count)

  DATA.groundEdgeArr.forEach((e, index) => {
    const area = UTIL.calculatePolygonArea(e)
    const edgePoints = UTIL.generatePointsOnPolygonEdge(e, area / 300000)
    const randomScale = DATA.sceneScale * Math.floor(Math.random() * 5 + 10) / 10

    if ([0, 1, 2, 3, 8, 16, 19, 20].includes(index)) {
      for (let i = 0, len = area / 100000; i < len; i++) {
        const position = UTIL.generateRandomPointInPolygon(e)
        const newTree = mainTree.clone()
        newTree.scale.set(randomScale / 1.5, randomScale / 1.5, randomScale / 1.5)
        newTree.position.set(position[0], 0, position[1])
        newTree.rotation.y = Math.random() * 3.14
        treeArr1.push(newTree)
      }


      for (let i = 0; i < edgePoints.length; i++) {
        const newTree = mainTree.clone()
        const randomScale = DATA.sceneScale * Math.floor(Math.random() * 5 + 10) / 10
        newTree.scale.set(randomScale / 1.5, randomScale / 1.5, randomScale / 1.5)
        newTree.position.set(edgePoints[i][0], 0, edgePoints[i][1])
        newTree.rotation.y = Math.random() * 3.14
        treeArr1.push(newTree)
      }

    } else {
      for (let i = 0, len = area / 50000; i < len; i++) {
        const position = UTIL.generateRandomPointInPolygon(e)
        const newTree = singleTree.clone()
        newTree.scale.set(randomScale / 0.7, randomScale / 0.7, randomScale / 0.7)
        newTree.position.set(position[0], 0, position[1])
        newTree.rotation.y = Math.random() * 3.14
        treeArr2.push(newTree)
      }

      for (let i = 0; i < edgePoints.length; i++) {
        const newTree = singleTree.clone()
        const randomScale = DATA.sceneScale * Math.floor(Math.random() * 5 + 10) / 10
        newTree.scale.set(randomScale / 0.7, randomScale / 0.7, randomScale / 0.7)
        newTree.position.set(edgePoints[i][0], 0, edgePoints[i][1])
        newTree.rotation.y = Math.random() * 3.14
        treeArr2.push(newTree)
      }
    }
  })


  CACHE.originTreeArr.forEach(e => {
    const randomScale = DATA.sceneScale * Math.floor(Math.random() * 5 + 10) / 10
    const newTree = mainTree.clone()
    newTree.scale.set(randomScale / 3, randomScale / 3, randomScale / 3)
    newTree.position.set(e.position.x, 0, e.position.z)
    newTree.rotation.y = Math.random() * 3.14
    treeArr1.push(newTree)
  })
  UTIL.instantiationSingleInfo(treeArr1, 'tree1')
  CACHE.originTreeArr.splice(0, CACHE.originTreeArr.length)

  UTIL.instantiationSingleInfo(treeArr2, 'tree2')
  treeArr2.splice(0, treeArr2.length)
}

// 保存外景的 meshes 进出建筑显隐
function saveWJMeshes() {
  STATE.WJMeshes = []
  STATE.WJMeshes.push(STATE.sceneList.WJ)
  STATE.WJMeshes.push(STATE.sceneList.tree1)
  STATE.WJMeshes.push(STATE.sceneList.tree2)
}


// 启动时改变环境样式
function changeEnvironment() {
  STATE.sceneList.WJ.traverse(e => {
    if (e.isMesh && e.material.type === 'MeshStandardMaterial') {
      if (e.material.name === 'ding1') {
        e.material.envMapIntensity = 0

      } else if (e.name.includes('Shu_')) {
        e.visible = false
        e.material.dispose()
        e.geometry.dispose()
        setTimeout(() => {
          e.parent.remove(e)
        }, 0)

      } else {
        e.material.envMapIntensity = 0.2
      }
    }
  })
  container.filterPass.enabled = true
  container.filterPass.filterMaterial.uniforms.saturation.value = 0.65
}



// 左键双击事件
function doubleClickFunc(firstObj) {
  const obj = firstObj.object
  console.log('obj: ', obj);

  const building = obj.userData.building
  const floor = obj.userData.floor

  if (STATE.currentScene.value === 'home' && building) {
    const cameraStatePosition = UTIL.getCameraToTargetPosition(firstObj.point)
    const cameraState = {
      position: cameraStatePosition,
      target: firstObj.point
    }
    UTIL.cameraAnimation({
      cameraState,
      callback: () => enterBuilding(building)
    })
  }
}



// hover 事件
function hoverFunc(hoverEvent) {
  if (!CACHE.container) return

  if (hoverEvent.objects[0]) {
    const firstObj = hoverEvent.objects[0]

    const obj = firstObj.object
    const building = obj.userData.building
    const floor = obj.userData.floor
    if (building) {
      const meshes = CACHE.container.clickObjects.filter(e => e.userData?.building === building)
      CACHE.container.outlineObjects = meshes

    } else if (floor) {
      const meshes = CACHE.container.clickObjects.filter(e => e.userData?.floor === floor)
      CACHE.container.outlineObjects = meshes
      STATE.floorSplit.hover(floor)
    }

  } else {
    CACHE.container.outlineObjects = []
  }
}


// 进入建筑
function enterBuilding(building) {
  if (STATE.currentScene.value !== 'home') return

  CACHE.container.setSkyBox(["/editor/35.jpg"])
  STATE.WJMeshes.forEach(e => {
    e.visible = false
  })
  if (building === '201') {
    STATE.sceneList['201-v1'].visible = true
    STATE.currentScene.value = 'building_201'
    container.clickObjects = STATE.saveClickObjects['201']
    container.orbitCamera.position.set(1040.42, 570, -692.77)
    container.orbitControls.target.set(-54.74, 100, 167.14)

  } else if (building === '211') {
    STATE.sceneList['211-v1'].visible = true
    STATE.currentScene.value = 'building_211'
    container.clickObjects = STATE.saveClickObjects['211']
    container.orbitCamera.position.set(-22.24, 788.51, 1538.16)
    container.orbitControls.target.set(-23.51, 197.31, 151.62)
  }
}


// 楼层拆分类
class FloorSplit {
  tween = null
  model = null
  activeFloor = null

  constructor(floor = '') {
    if (floor !== undefined) { this.activeFloor = floor }
  }


  hover(floor) {
    if (floor !== undefined) {
      if (floor === this.activeFloor) {
        return
      }
      this.activeFloor = floor
    }

    let tempModel = null
    if (STATE.currentScene.value === 'building_201') tempModel = STATE.sceneList['201-v1']
    else if (STATE.currentScene.value === 'building_211') tempModel = STATE.sceneList['211-v1']

    if (tempModel !== this.model) {
      this.clearTween()
      this.model = tempModel
      this.setTween()
    }

    let floorNum = this.activeFloor.split('F')[0]
    this.model.children[0].children.forEach(e => {
      let eFloorNum = e.userData.floor.split('F')[0]
      if (eFloorNum > floorNum) {
        this.tween[e.userData.floor].stop()
        this.tween[e.userData.floor] = null

        const t = new TWEEN.Tween(e.position)
        t.to({ y: e.userData.y + 8 }, 300)
        t.easing(TWEEN.Easing.Quadratic.InOut)
        t.dynamic(true)
        this.tween[e.userData.floor] = t

        if (Math.abs(e.position.y - (e.userData.y + 8)) > 0.01) {
          this.tween[e.userData.floor].start()
        }

      } else {
        this.tween[e.userData.floor].stop()
        this.tween[e.userData.floor] = null

        const t = new TWEEN.Tween(e.position)
        t.to({ y: e.userData.y }, 300)
        t.easing(TWEEN.Easing.Quadratic.InOut)
        t.dynamic(true)
        this.tween[e.userData.floor] = t

        if (Math.abs(e.position.y - e.userData.y) > 0.01) {
          this.tween[e.userData.floor].start()
        }
      }
    })
  }

  setTween() {
    if (this.tween) {
      this.clearTween()
    }

    if (!this.model) return

    this.tween = {}
    this.model.children[0].children.forEach(e => {
      const t = new TWEEN.Tween(e.position)
      t.easing(TWEEN.Easing.Quadratic.InOut)
      t.dynamic(true)
      this.tween[e.userData.floor] = t
    })
  }

  clearTween() {
    if (!this.tween) return

    for (let key in this.tween) {
      this.tween[key].stop()
    }
    this.tween = null
  }
}
const floorSplit = new FloorSplit()
STATE.floorSplit = floorSplit


// 到主界面
function back() {
  if (STATE.currentScene.value.includes('building')) {
    STATE.sceneList['201-v1'].visible = false
    STATE.sceneList['211-v1'].visible = false

    CACHE.container.setSkyBox(["/editor/14.jpg"])
    STATE.WJMeshes.forEach(e => {
      e.visible = true
    })
    container.orbitCamera.position.addVectors(STATE.initCameraState.position, new Bol3D.Vector3())
    container.orbitControls.target.addVectors(STATE.initCameraState.target, new Bol3D.Vector3())

    CACHE.container.clickObjects = STATE.saveClickObjects.home

    let model = null
    if (STATE.currentScene.value === 'building_201') model = STATE.sceneList['201-v1']
    else if (STATE.currentScene.value === 'building_211') model = STATE.sceneList['211-v1']

    model.children[0].children.forEach(e => {
      e.position.y = e.userData.y
    })
    STATE.currentScene.value = 'home'

  } else if (STATE.currentScene.value === 'floor') {
    // todo
  }
}



render()
function render() {
  requestAnimationFrame(render)

  TWEEN.update()
}

export const API = {
  handleInitModel,
  initTree,
  doubleClickFunc,
  hoverFunc,
  changeEnvironment,
  saveWJMeshes,
  back,
  render
}
