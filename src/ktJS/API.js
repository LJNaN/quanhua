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
      uniform float lineLong;
      varying vec2 vUv; // 接收从顶点着色器传递过来的纹理坐标
      varying vec2 vPosition;

      void main() {
        vec4 color = vec4(0.7,0.7,0.7,1.);

        float threshold = 10.; // 控制留白的间距
        float blockWidth = 0.5; // 控制留白的宽度
        float flowSpeed = 5.0; // 控制流动速度
        float flowOffset = vUv.x - time * flowSpeed / lineLong; // 控制流动效果
        flowOffset = mod(flowOffset, threshold / lineLong); // 将偏移量限制在阈值范围内
        float blockMask = 1.0 - step(flowOffset, blockWidth / lineLong);


        color = vec4(0.0, 1.0, 1.0, 1.0);
        color.a = blockMask;
        

        gl_FragColor = color; // 应用纹理颜色到片元
        #include <logdepthbuf_fragment>
      }
    `

    // 创建 ShaderMaterial，并传入纹理
    const material = new Bol3D.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        long: { value: 1.0 }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true
    })
    material.needsUpdate = true

    return material
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

  // 删除面很多的栏杆
  qinglanFactory.traverse(e => {
    if (e.isMesh) {
      if ((e.name.includes('G_T_') && e.name.includes('_2')) || e.name.includes('_01_3') || e.name.includes('_T_01_2')) {
        e.visible = false

      } else if (e.name.includes('GuanDao_')) {
        STATE.pipelineList.push(e)
      }
    }
  })


  // 开始施法  计算每个管子的方向是 x, y 还是 z
  STATE.pipelineList.forEach(e => {
    Object.setPrototypeOf(e, Pipeline.prototype)
    // e.materialType = 'default'
    // e.material = STATE.pipelineMaterial.default.clone()
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

    const material = e.initShaderMaterial()
    e.material = material
    e.material.uniforms.long.value = max




    if (e.name.includes('164')) {
      const geometry = e.geometry;
      console.log('e: ', e);
      // 获取管状模型的顶点数据
      const count = geometry.attributes.position.count
      // 计算两侧封顶的中心点
      const centerPoint1 = new Bol3D.Vector3();
      const centerPoint2 = new Bol3D.Vector3();
      let centerBasePoint1 = null
      let centerPoint1Count = 0
      let centerPoint2Count = 0
      let temp = {}

      for (let i = 0; i < count; i++) {
        const worldPosition = new Bol3D.Vector3()
        worldPosition.fromBufferAttribute(geometry.attributes.position, i).applyMatrix4(e.matrixWorld)

        if (temp[worldPosition.x + ',' + worldPosition.y + ',' + worldPosition.z]) {
          continue

        } else {
          temp[worldPosition.x + ',' + worldPosition.y + ',' + worldPosition.z] = 1
          const a = new Bol3D.Vector3(worldPosition.x, worldPosition.y, worldPosition.z)
          if (!centerBasePoint1) {
            centerPoint1.x += worldPosition.x;
            centerPoint1.y += worldPosition.y;
            centerPoint1.z += worldPosition.z;
            centerPoint1Count++
            centerBasePoint1 = a.clone()

          } else {
            const dis = a.distanceTo(centerBasePoint1)

            if (dis > 10) {
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
      // 计算管状模型的朝向向量
      const directionVector = new Bol3D.Vector3();
      directionVector.subVectors(centerPoint2, centerPoint1).normalize()
      e.userData.directionVector = directionVector
      console.log('directionVector: ', directionVector);
      console.log('temp: ', temp);


      const array = geometry.attributes.position.array
      for (let i = 0; i < count; i++) {
        const worldPosition = new Bol3D.Vector3()
        worldPosition.fromBufferAttribute(geometry.attributes.position, i).applyMatrix4(e.matrixWorld)
        // 在direction上的投影
        const projectVector = worldPosition.clone().projectOnVector(directionVector);
        if (i === 0) {
          console.log('worldPosition: ', worldPosition);
          console.log('projectVector: ', projectVector);
          const g2 = new Bol3D.BoxGeometry(10, 10, 500);
          const m2 = new Bol3D.MeshBasicMaterial({ color: 0x00ff00 });
          const cylinderMesh = new Bol3D.Mesh(g2, m2);
          cylinderMesh.lookAt(directionVector);
          cylinderMesh.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
          // cylinderMesh.position.set(projectVector.x, projectVector.y, projectVector.z);
          container.scene.add(cylinderMesh);
          console.log('cylinderMesh: ', cylinderMesh);
          UTIL.setModelPosition(cylinderMesh)
        }
        // const distance = new Bol3D.Vector3().subVectors(projectVector, worldPosition)

        // distance.multiplyScalar(5)

        // 将修改后的坐标重新写回顶点数组
        //   array[i / 3] = distance.x;
        //   array[i / 3 + 1] = distance.y;
        //   array[i / 3 + 2] = distance.z;
        // }

        geometry.attributes.position.needsUpdate = true;
      }
    }
  })

  // control回调
  CACHE.container.orbitControls.addEventListener('end', () => {
    // const p = CACHE.container.orbitCamera.position.clone()
    // const t = CACHE.container.orbitControls.target.clone()
    // const distance = p.distanceTo(t)
    // STATE.pipelineList.forEach(e => {
    //   const directionVector = e.userData.directionVector
    //   e.scale.set( 1 / directionVector.x * distance / 500 + 1,  1 / directionVector.y * distance / 500 + 1,  1 / directionVector.z * distance / 500 + 1)
    //   // if (e.userData.direction === 'x') e.scale.set(1, distance / 100, distance / 100)
    //   // else if (e.userData.direction === 'y') e.scale.set(distance / 100, 1, distance / 100)
    //   // else if (e.userData.direction === 'z') e.scale.set(distance / 100, distance / 100, 1)
    // })
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
  // if (STATE.pipelineList.length) {
  //   STATE.pipelineList.forEach(e => {
  //     e.material.uniforms.time.value = time
  //   })
  // }

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
