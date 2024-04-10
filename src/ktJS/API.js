import { STATE } from './STATE.js'
import { CACHE } from './CACHE.js'
import { DATA } from './DATA.js'
import { UTIL } from './UTIL.js'
import { SimplifyModifier } from '@/assets/js/SimplifyModifier.js';
import * as TWEEN from '@tweenjs/tween.js'
import { watch } from 'vue'



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
  get flowReverse() {
    return this._flowReverse
  }

  set flowReverse(val) {
    this._flowReverse = val
    this.userData.shaderMaterial.uniforms.reverse.value = val ? 1 : 0
  }

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
      uniform int reverse; // 流动方向反转
      uniform vec3 colors[5]; // 接收颜色
      varying vec2 vUv; // 接收从顶点着色器传递过来的纹理坐标
      varying vec2 vPosition;

      void main() {
        float threshold = 14.; // 控制留白的间距
        float blockWidth = 7.; // 控制留白的宽度
        float flowSpeed = 10.0; // 控制流动速度
        flowSpeed = reverse == 0 ? flowSpeed : -flowSpeed;
        float flowOffset = vUv.x - time * flowSpeed; // 控制流动效果
        flowOffset = mod(flowOffset, threshold); // 将偏移量限制在阈值范围内
        float blockMask = 1.0 - step(flowOffset, blockWidth);

        vec4 color = vec4(1.,1.,1.,1.);

        // 检查有多少个有效颜色(也就是路线重复的)
        int effectiveColorNum = 0;
        for(int i = 0; i < 5; i++) {
          if(colors[i].r != 0. || colors[i].g != 0. || colors[i].b != 0.) {
            effectiveColorNum++;
          }
        }

        // 根据effectiveColorNum 计算 vUv.y
        // 已使用的颜色数量
        int usedColorNum = 0;
        for(int i = 0; i < 5; i++) {
          if(colors[i].r != 0. || colors[i].g != 0. || colors[i].b != 0.) {
            if(vUv.y > (float(usedColorNum) / float(effectiveColorNum))) {
              color = vec4(colors[i], 1.0);
            }
            usedColorNum++;
          }
        }

        color.a = blockMask < 0.7 ? blockMask + 0.3 : blockMask;
      
        gl_FragColor = color; // 应用纹理颜色到片元
        #include <logdepthbuf_fragment>
      }
    `

    // 创建 ShaderMaterial，并传入纹理
    const pipelineLength = this.computeBoundingLen()

    const noneColor = new Bol3D.Color(0x000000)
    const material = new Bol3D.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        pipelineLong: { value: pipelineLength },
        reverse: { value: 0 },
        colors: { value: [noneColor, noneColor, noneColor, noneColor, noneColor] }
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


// 场景加载后的操作
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
  qinglanFactory.children[0].children.forEach(e => {
    if (e.name === 'GangFeng') {
      e.traverse(e2 => {
        if (e2.isMesh && e2.name.includes('GuanDao_')) {
          e2.userData.belong = 'QLS_GangFeng'
          e2.userData.number = Number(e2.name.replace('GuanDao_', ''))
          STATE.pipelineList.push(e2)
        }
      })

    } else if (e.name === 'ZhongHua1') {
      e.traverse(e2 => {
        if (e2.isMesh && e2.name.includes('GuanDao_')) {
          e2.userData.belong = 'QLS_ZhongHua'
          e2.userData.number = Number(e2.name.replace('GuanDao_', ''))
          STATE.pipelineList.push(e2)
        }
      })
    }
  })



  // 开始施法  计算每个管子的方向是 x, y 还是 z
  const defaultMaterial = new Bol3D.MeshLambertMaterial({ color: 0xFFFFFF })
  STATE.pipelineList.forEach(e => {
    Object.setPrototypeOf(e, Pipeline.prototype)
    e.initRadiusData()
    e.initShaderMaterial()
    e.userData.defaultMaterial = defaultMaterial
    e.userData.isShuangXiang = e.parent.name.includes('ShuangXiang_')
    e.materialType = 'default'
    e.flowReverse = e.userData.isShuangXiang
    // e.materialType = 'flow'
  })

  setCanNumber()

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


// 往管子上设置编号、贴图
function setCanNumber() {
  const zhonghua = STATE.sceneList.qinglanFactory.children.find(e => e.name === 'QLS').children.find(e => e.name === 'ZhongHua1').children.find(e => e.name === 'ZhongHua1_Guan')

  DATA.pipelineMap.qinglanshan.zhonghua.canToPipelineMap.forEach(e => {
    const textureModel = zhonghua.children.find(model => model.name === e.can)
    if (!textureModel || textureModel.isGroup) return

    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 500
    const ctx = canvas.getContext('2d')
    ctx.font = "bold 120px Arial"
    ctx.fillStyle = "#1e4f91";
    ctx.textAlign = 'center';
    ctx.fillText(`${e.can}`, 500, 400)

    const logo = new Image()
    logo.src = '/assets/img/4.png'
    logo.onload = () => {
      ctx.drawImage(logo, 250, 80, 500, 160)
      const imgUrl = canvas.toDataURL()
      const finishedImg = new Image()
      finishedImg.src = imgUrl

      textureModel.material = textureModel.material.clone()
      textureModel.material.color.set('#ffffff')
      const textureLoader = new Bol3D.TextureLoader();
      const texture = textureLoader.load(imgUrl)
      textureModel.material.transparent = true
      textureModel.material.opacity = 1
      textureModel.material.map = texture
    }
  })
}


// 管道状态重置
function pipeLineReset() {
  STATE.pipelineList.forEach(e => {
    e.materialType = 'default'
    e.flowReverse = false
    const noneColor = new Bol3D.Color(0x000000)
    e.userData.shaderMaterial.uniforms.colors.value = [noneColor, noneColor, noneColor, noneColor, noneColor]
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


// 随机设置任务
function randomTask() {
  // 青兰山/中化
  const data = DATA.pipelineMap.qinglanshan.zhonghua
  const randomBoatPort = data.boatPort[Math.floor(Math.random() * data.boatPort.length)]
  const randomTransferStation = Math.random() > 0.5 ? 'originOil' : 'finishedOil'
  const canToPipelineMap = DATA.pipelineMap.qinglanshan.zhonghua.canToPipelineMap
  const randomToCanPipeline = canToPipelineMap[Math.floor(Math.random() * canToPipelineMap.length)].pipeline
  const randomType = Math.random() > 0.5 ? 'in' : 'out'
  const transferStationPipeline = DATA.pipelineMap.qinglanshan.zhonghua[randomTransferStation]

  setTask({
    boat: '船1',
    port: '港口1',
    station: randomTransferStation,
    start1: randomBoatPort,
    end1: transferStationPipeline[0],
    start2: transferStationPipeline[1],
    end2: randomToCanPipeline,
    type: randomType
  })
}


// 设置队列任务
function setTask(options) {
  const { boat, port, station, start1, end1, start2, end2, type } = options
  const color = DATA.flowColorMap.find(e => !STATE.taskQueue.value.map(e2 => e2.color).includes(e)) || DATA.flowColorMap[Math.floor(Math.random() * DATA.flowColorMap.length)]
  const path1 = type === 'in' ? UTIL.findPath(start1, end1) : UTIL.findPath(end2, end1)
  const path2 = type === 'in' ? UTIL.findPath(start2, end2) : UTIL.findPath(start2, start1)

  STATE.taskQueue.value.push({ boat, port, station, path1, path2, type, color })
}

// 移除任务，传任务对象
function removeTask(task) {
  const target = STATE.taskQueue.value.findIndex(e => e === task)
  if (target >= 0) {
    STATE.taskQueue.value.splice(target, 1)
  }
}

// 监听队列任务
watch(STATE.taskQueue.value,
  (taskQueue) => {
    API.pipeLineReset()
    taskQueue.forEach(task => {
      STATE.pipelineList.forEach(pipeline => {
        if (task.path1.includes(pipeline.userData.number) || task.path2.includes(pipeline.userData.number)) {
          if (pipeline.userData.isShuangXiang) {
            pipeline.flowReverse = task.type === 'in'
          }

          const shaderColors = pipeline.userData.shaderMaterial.uniforms.colors.value
          for (let i = 0; i < shaderColors.length; i++) {
            if (shaderColors[i].getHexString() === '000000') {
              shaderColors[i] = new Bol3D.Color(task.color)
              break
            }
          }

          pipeline.materialType = 'flow'
          pipeline.flowReverse = pipeline.userData.isShuangXiang
        }
      })
    })
  }
)



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
  setTask,
  removeTask,
  randomTask,
  render
}
