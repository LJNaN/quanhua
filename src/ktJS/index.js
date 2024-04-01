import { API } from './API.js'
import { UTIL } from './UTIL.js'
import { CACHE } from './CACHE.js'
import { STATE } from './STATE.js'
import { DATA } from './DATA.js'

let container

// 通过配置文件加载
export const loadSceneByJSON = ({ domElement, callback }) => {
  fetch(`${STATE.PUBLIC_PATH}/editor/bol3d.json`) // 配置文件路径
    .then((res) => {
      return res.json()
    })
    .then((result) => {
      const nodeData = result.data
      const fileList = result.fileList

      container = new Bol3D.Container({
        publicPath: `${STATE.PUBLIC_PATH}`,
        assetsPath: `${STATE.PUBLIC_PATH}/editor/`, // 节点解析，资源文件路径（包含模型, hdr，天空盒，材质贴图， 图片等）
        container: domElement,
      })

      const jsonParser = new Bol3D.JSONParser({
        container,
        modelUrls: fileList,
      })
      jsonParser.parseNodes(nodeData, jsonParser.nodes) // 解析节点, jsonParser.nodes存储了配置文件导出的所有节点信息
      container.loadModelsByUrl({
        modelUrls: jsonParser.modelUrls,
        onProgress: (model, evt) => {
          GLOBAL.loadedModelNum++
          GLOBAL.loadingPercent.value = Math.floor(GLOBAL.loadedModelNum / GLOBAL.modelNum * 100) - 1

          API.handleInitModel(model, evt)

        },
        onLoad: (evt) => {
          CACHE.container = evt
          window.container = evt

          API.initTree()
          UTIL.instanceInit()

          evt.updateSceneByNodes(jsonParser.nodes[0], 0, () => {
            API.changeEnvironment()
            API.saveWJMeshes()
            STATE.initCameraState.position = evt.orbitCamera.position.clone()
            STATE.initCameraState.target = evt.orbitControls.target.clone()
            GLOBAL.loadingPercent.value = 100
          })
        }
      })

      const events = new Bol3D.Events(container)

      // 以前的事件使用方法不变
      events.ondblclick = (e) => {
        if (e.event.button === 0) {// 左键
          if (e.objects.length) {
            API.doubleClickFunc(e.objects[0])
          }
          
        } else if (e.event.button === 2) { // 右键
          API.back()
        }
      }

      events.onhover = (e) => {
        API.hoverFunc(e)
      }
    })
}
