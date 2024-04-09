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
    if (val === 'default') this.material = this.userData.defaultMaterial
    else if (val === 'flow') this.material = this.userData.shaderMaterial
   
    // if (DATA.mapReversePipelineList.includes(Number(this.name.split('GuanDao_')[1]))) {
    //   if (this.material.map) {
    //     const map = this.material.map.clone()
    //     this.material.map = map.clone()
    //     this.material.map.needsUpdate = true
    //     this.material.map.repeat.set(-1, -1)
    //   }
    // }
  }

  initShaderMaterial() {
    // shader
    // 顶点着色器代码
    const vertexShader = `
      #include <logdepthbuf_pars_vertex>
      #include <common>

      uniform float time;
      varying vec2 vUv; // 传递纹理坐标给片元着色器
      varying vec2 vPosition;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

        
        #include <logdepthbuf_vertex>
      }
    `

    // 片元着色器代码
    const fragmentShader = `
      #include <logdepthbuf_pars_fragment>
      #include <common>
      
      uniform float time;
      uniform float pipelineLong;
      varying vec2 vUv; // 接收从顶点着色器传递过来的纹理坐标
      varying vec2 vPosition;

      void main() {
        vec4 color1 = vec4(0.0,1.,1.,0.7);
        vec4 color2 = vec4(1.,0.0,0.0,0.7);

        float threshold = 5.; // 控制留白的间距
        float blockWidth = 1.; // 控制留白的宽度
        float flowSpeed = 10.0; // 控制流动速度
        float flowOffset = vUv.x - time * flowSpeed; // 控制流动效果
        flowOffset = mod(flowOffset, threshold); // 将偏移量限制在阈值范围内
        float blockMask = 1.0 - step(flowOffset, blockWidth );

        vec4 color = vec4(0.,1.,1.,1.);
        // if(vUv.y > 0.75 || vUv.y < 0.25) {
        //   color = color2;
        // } else {
        //   color = color1;
        // }
        color.a = blockMask;
        

        gl_FragColor = color; // 应用纹理颜色到片元
        #include <logdepthbuf_fragment>
      }
    `

    // 创建 ShaderMaterial，并传入纹理
    const pipelineLength = this.computeBoundingLen()

    const material = new Bol3D.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        pipelineLong: { value: pipelineLength }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true
    })
    material.needsUpdate = true
    this.userData.shaderMaterial = material
  }

  computeBoundingLen() {
    const geometry = this.geometry;
    geometry.computeBoundingBox()
    const worldBox = new Bol3D.Box3().copy(geometry.boundingBox).applyMatrix4(this.matrixWorld)
    const length = worldBox.getSize(new Bol3D.Vector3()).length()

    this.userData.long = length
    return length
  }

  get radius() {
    return this._radius
  }

  set radius(val) {
    if (typeof (val) !== 'number') {
      console.error(
        '要输入 Number 类型')
      return
    }
    if (!this.userData.directionList || !this.userData.originDistanceList || !this.userData.worldPositionList) {
      console.error(
        '没有初始数据，请先运行initRadiusData()')
      return
    }

    this._radius = val
    const geometry = this.geometry;
    // 获取管状模型的顶点数据
    const count = geometry.attributes.position.count
    const array = geometry.attributes.position.array


    for (let i = 0; i < count; i++) {
      // 新的距离
      const distance = this.userData.originDistanceList[i]
      const direction = this.userData.directionList[i].clone()
      const worldPosition = this.userData.worldPositionList[i]

      const newDistance = (val + 1) * distance
      const moveVector = direction.multiplyScalar(newDistance)
      const newPosition = new Bol3D.Vector3().copy(worldPosition).add(moveVector)
      const inverseMatrix = new Bol3D.Matrix4()
      inverseMatrix.copy(this.matrixWorld).invert()

      const newP = new Bol3D.Vector3()
      newP.copy(newPosition)
      newP.applyMatrix4(inverseMatrix)
      array[i * 3] = newP.x;
      array[i * 3 + 1] = newP.y;
      array[i * 3 + 2] = newP.z;
    }
    geometry.attributes.position.needsUpdate = true
  }

  initRadiusData() {
    const geometry = this.geometry;
    // 获取管状模型的顶点数据
    const count = geometry.attributes.position.count
    // 计算两侧封顶的中心点
    const centerPoint1 = new Bol3D.Vector3();
    const centerPoint2 = new Bol3D.Vector3();
    const threshold = 5 // 超过5就认为他们不在这个顶盖上
    let centerBasePoint1 = null
    let centerPoint1Count = 0
    let centerPoint2Count = 0
    const directionList = [] // 每个点的世界坐标与当前中心点的向量的集合
    const originDistanceList = [] // 每个点的世界坐标与中心点的距离的集合
    const worldPositionList = [] // 每个点的世界位置集合

    const filterList = {}
    // 计算两个顶盖的中心位置
    for (let i = 0; i < count; i++) {
      const worldPosition = new Bol3D.Vector3()
      worldPosition.fromBufferAttribute(geometry.attributes.position, i).applyMatrix4(this.matrixWorld)
      worldPositionList.push(worldPosition)

      if (filterList[worldPosition.x + ',' + worldPosition.y + ',' + worldPosition.z]) {
        continue

      } else {
        filterList[worldPosition.x + ',' + worldPosition.y + ',' + worldPosition.z] = 1
        const a = new Bol3D.Vector3(worldPosition.x, worldPosition.y, worldPosition.z)
        if (!centerBasePoint1) {
          centerPoint1.x += worldPosition.x;
          centerPoint1.y += worldPosition.y;
          centerPoint1.z += worldPosition.z;
          centerPoint1Count++
          centerBasePoint1 = a.clone()

        } else {
          const dis = a.distanceTo(centerBasePoint1)

          if (dis > threshold) {
            centerPoint2.x += worldPosition.x;
            centerPoint2.y += worldPosition.y;
            centerPoint2.z += worldPosition.z;
            centerPoint2Count++

          } else {
            centerPoint1.x += worldPosition.x;
            centerPoint1.y += worldPosition.y;
            centerPoint1.z += worldPosition.z;
            centerPoint1Count++
          }
        }
      }
    }
    centerPoint1.divideScalar(centerPoint1Count);
    centerPoint2.divideScalar(centerPoint2Count);

    // 找离中心点的距离
    for (let i = 0; i < count; i++) {
      const worldPosition = new Bol3D.Vector3()
      worldPosition.fromBufferAttribute(geometry.attributes.position, i).applyMatrix4(this.matrixWorld)
      const dis1 = new Bol3D.Vector3().copy(worldPosition).distanceTo(centerPoint1)
      const dis2 = new Bol3D.Vector3().copy(worldPosition).distanceTo(centerPoint2)
      let point = 1
      let min = 0
      // 找离哪个顶盖最近，离中心点的距离是多少
      if (dis1 > dis2) {
        point = 2
        min = dis2
      } else {
        point = 1
        min = dis1
      }
      originDistanceList.push(min)

      // 当前点到最近的顶盖中心点的向量
      let dir = null
      if (point === 1) {
        dir = new Bol3D.Vector3().subVectors(centerPoint1, worldPosition)
      } else if (point === 2) {
        dir = new Bol3D.Vector3().subVectors(centerPoint2, worldPosition)
      }
      directionList.push(dir.clone().normalize())
    }

    this.userData.directionList = directionList
    this.userData.originDistanceList = originDistanceList
    this.userData.worldPositionList = worldPositionList
  }
}



function afterOnload() {
  // 地面
  const dimian = STATE.sceneList['1'].children.find(e => e.name === 'DiMian')
  dimian.visible = false

  // 主厂区
  const mainFactory = STATE.sceneList['1'].children.find(e => e.name === 'ZhongHua2')
  mainFactory.visible = false

  // 主厂区船舶
  const mainFactoryPark = STATE.sceneList['1'].children.find(e => e.name === 'SYB1')
  mainFactoryPark.visible = false

  // 青兰山
  const qinglanFactory = STATE.sceneList['1'].children.find(e => e.name === 'qls_01')

  STATE.sceneList.dimian = dimian
  STATE.sceneList.mainFactory = mainFactory
  STATE.sceneList.mainFactoryPark = mainFactoryPark
  STATE.sceneList.qinglanFactory = qinglanFactory

  // 生成管道数组
  qinglanFactory.traverse(e => {
    if (e.isMesh && e.name.includes('GuanDao_')) {
      STATE.pipelineList.push(e)
    }
  })


  // 开始施法  计算每个管子的方向是 x, y 还是 z
  const defaultMaterial = new Bol3D.MeshLambertMaterial({ color: 0xFFFFFF })
  STATE.pipelineList.forEach((e, index) => {
    Object.setPrototypeOf(e, Pipeline.prototype)
    e.initRadiusData()
    e.initShaderMaterial()
    e.userData.defaultMaterial = defaultMaterial
    e.materialType = 'default'
    // e.materialType = 'flow'

    // e.materialType = 'default'
    // e.material = STATE.pipelineMaterial.default.clone()
    // e.material = material
  })

  // control回调
  CACHE.container.orbitControls.addEventListener('end', () => {
    const p = CACHE.container.orbitCamera.position.clone()
    const t = CACHE.container.orbitControls.target.clone()
    const distance = p.distanceTo(t)

    // 管道近小远大
    STATE.pipelineList.forEach(e => {
      e.radius = distance / 200
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
      if (e?.material?.uniforms?.time) {
        e.material.uniforms.time.value = time
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
