import { STATE } from './STATE.js'
import { CACHE } from './CACHE.js'
import { DATA } from './DATA.js'
import { UTIL } from './UTIL.js'
import { SimplifyModifier } from '@/assets/js/SimplifyModifier.js';
import * as TWEEN from '@tweenjs/tween.js'



// 处理 progress 中加载的模型
function handleInitModel(model, evt) {
  STATE.sceneList[model.name] = model
}


// 左键双击事件
function doubleClickFunc(firstObj) {
  const obj = firstObj.object

}

// 继承一下PipeLine
class Pipeline extends Bol3D.Mesh {
  get materialType() {
    return this._materialType
  }

  set materialType(val) {
    this._materialType = val
    if (val === 'default') this.material = STATE.pipelineMaterial.default.clone()
    else if (val === 'red') this.material = STATE.pipelineMaterial.red.clone()
    else if (val === 'blue') this.material = STATE.pipelineMaterial.blue.clone()
    else if (val === 'both') this.material = STATE.pipelineMaterial.both.clone()

    if (DATA.mapReversePipelineList.includes(Number(this.name.split('GuanDao_')[1]))) {
      if (this.material.map) {
        const map = this.material.map.clone()
        this.material.map = map.clone()
        this.material.map.needsUpdate = true
        this.material.map.repeat.set(-1, -1)
      }
    }
  }
}

function afterOnload() {
  STATE.sceneList['1'].traverse(e => {
    if (e.name === 'DiMian') {
      e.visible = false

    } else if (e.isMesh) {
      if (e.material?.name.includes('louti_Base')) {
        e.visible = false

      } else if (e.name === 'GuanDao_15') {
        STATE.pipelineMaterial.blue = e.material.clone()
        STATE.pipelineMaterial.default = e.material.clone()
        STATE.pipelineMaterial.default.map = null
        STATE.pipelineMaterial.default.color.set(0x050505)

      } else if (e.name === 'GuanDao_16') {
        STATE.pipelineMaterial.red = e.material.clone()

      } else if (e.name === 'GuanDao_07') {
        STATE.pipelineMaterial.both = e.material.clone()
      }
    }

    if (e.name.includes('GuanDao_')) {
      STATE.pipelineList.push(e)
    }
  })

  // 开始施法  计算每个管子的方向是 x 还是 z
  STATE.pipelineList.forEach(e => {
    Object.setPrototypeOf(e, Pipeline.prototype)
    e.materialType = 'default'
    e.material = STATE.pipelineMaterial.default.clone()
    e.geometry.computeBoundingBox()
    const distanceX = Math.abs(e.geometry.boundingBox.max.x - e.geometry.boundingBox.min.x)
    const distanceY = Math.abs(e.geometry.boundingBox.max.y - e.geometry.boundingBox.min.y)
    const distanceZ = Math.abs(e.geometry.boundingBox.max.z - e.geometry.boundingBox.min.z)
    const max = Math.max(distanceX, distanceY, distanceZ)

    let direction = 'x'
    if (max === distanceX) direction = 'x'
    else if (max === distanceY) direction = 'y'
    else if (max === distanceZ) direction = 'z'
    e.userData.direction = direction
  })

  // control回调
  CACHE.container.orbitControls.addEventListener('end', () => {
    const p = CACHE.container.orbitCamera.position.clone()
    const t = CACHE.container.orbitControls.target.clone()
    const distance = p.distanceTo(t)
    STATE.pipelineList.forEach(e => {
      if (e.userData.direction === 'x') e.scale.set(1, distance / 100, distance / 100)
      else if (e.userData.direction === 'y') e.scale.set(distance / 100, 1, distance / 100)
      else if (e.userData.direction === 'z') e.scale.set(distance / 100, distance / 100, 1)
    })
  })
}


// 重置
function pipeLineReset() {
  STATE.pipelineList.forEach(e => {
    e.materialType = 'default'
  })
}


// hover 事件
function hoverFunc(hoverEvent) {
  if (!CACHE.container) return

  if (hoverEvent.objects[0]) {
    const firstObj = hoverEvent.objects[0]

  } else {
    CACHE.container.outlineObjects = []
  }
}


render()
function render() {
  requestAnimationFrame(render)

  const time = STATE.clock.getElapsedTime()
  if (STATE.pipelineList.length) {
    STATE.pipelineList.forEach(e => {
      if (e.materialType !== 'default') {
        if(DATA.mapReversePipelineList.includes(Number(e.name.split('GuanDao_')[1]))) {
          e.material.map.offset.x -= 0.005
          
        } else {
          e.material.map.offset.x -= 0.001
        }
      }
    })
  }

  TWEEN.update()
}

export const API = {
  handleInitModel,
  doubleClickFunc,
  hoverFunc,
  afterOnload,
  pipeLineReset,
  render
}
