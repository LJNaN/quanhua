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
      console.log('e: ', e);

      var geometry = e.geometry;
      // 获取管状模型的顶点数据
      var positions = geometry.attributes.position.array;
      console.log('positions: ', positions);

      // 计算两侧封顶的中心点
      var centerPoint1 = new Bol3D.Vector3();
      var centerPoint2 = new Bol3D.Vector3();
      var centerBasePoint1 = null
      var centerBasePoint2 = null
      let centerPoint1Count = 0
      let centerPoint2Count = 0
      const count = e.geometry.attributes.position.count
      console.log('count: ', count);

      let temp = {}

      for (let i = 0; i < count; i += 3) {
        if (temp[positions[i] + '' + positions[i + 1] + '' + positions[i + 2]]) {
          continue

        } else {
          temp[positions[i] + '' + positions[i + 1] + '' + positions[i + 2]] = 1

          const a = new Bol3D.Vector3(positions[i], positions[i + 1], positions[i + 2])
          if (!centerBasePoint1) {
            centerPoint1.x += positions[i];
            centerPoint1.y += positions[i + 1];
            centerPoint1.z += positions[i + 2];
            centerPoint1Count++
            centerBasePoint1 = a.clone()

          } else {
            const dis = a.distanceTo(centerBasePoint1)
            console.log('dis: ', dis);
            if (dis > 10) {
              centerPoint2.x += positions[i];
              centerPoint2.y += positions[i + 1];
              centerPoint2.z += positions[i + 2];
              centerPoint2Count++

            } else {
              centerPoint1.x += positions[i];
              centerPoint1.y += positions[i + 1];
              centerPoint1.z += positions[i + 2];
              centerPoint1Count++
            }
          }
        }
      }

      console.log('temp: ', temp);
      centerPoint1.divideScalar(centerPoint1Count);
      centerPoint2.divideScalar(centerPoint2Count);
      console.log('centerPoint1Count: ', centerPoint1Count);
      console.log('centerPoint2Count: ', centerPoint2Count);
      console.log('centerPoint1: ', centerPoint1);
      console.log('centerPoint2: ', centerPoint2);

      // 计算管状模型的朝向向量
      var directionVector = new Bol3D.Vector3();
      directionVector.subVectors(centerPoint2, centerPoint1).normalize();

      // 现在directionVector就是管状模型的朝向向量
      console.log(directionVector);
      // const directionVector = new Bol3D.Vector3()
      // e.userData.directionVector = directionVector

      // const g = new Bol3D.BoxGeometry(5)
      // const m = new Bol3D.MeshBasicMaterial({ color: 0xff0000 })
      // const mesh = new Bol3D.Mesh(g, m)
      // container.scene.add(mesh)

      e.userData.directionVector = directionVector


      var g2 = new Bol3D.BoxGeometry(500, 20, 20);

      // 创建一个材质
      var m2 = new Bol3D.MeshBasicMaterial({ color: 0x00ff00 });

      // 创建一个 Mesh
      var cylinderMesh = new Bol3D.Mesh(g2, m2);

      // 将圆柱的方向调整为指定的向量
      cylinderMesh.lookAt(directionVector);

      // 将圆柱的位置调整为指定的向量的一半处
      cylinderMesh.position.set(0, 200, 0);

      // 添加到场景中
      container.scene.add(cylinderMesh);
      console.log('cylinderMesh: ', cylinderMesh);
      UTIL.setModelPosition(cylinderMesh)

      // const geometry = e.geometry
      // const positions = geometry.attributes.position.array;
      // for (var i = 0; i < positions.length; i += 3) {
      //   var x = positions[i];
      //   var y = positions[i + 1];
      //   var z = positions[i + 2];

      //   // 当前点位置
      //   var d = new Bol3D.Vector3(x, y, z);


      //   // 在direction上的投影
      //   var e = d.clone().projectOnVector(directionVector);



      //   const f = new Bol3D.Vector3().subVectors(d, e)

      //   f.multiplyScalar(5)




      //   // 将修改后的坐标重新写回顶点数组
      //   positions[i] = f.x;
      //   positions[i + 1] = f.y;
      //   positions[i + 2] = f.z;
      // }

      // geometry.attributes.position.needsUpdate = true;
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
