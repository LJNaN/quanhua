import { API } from './API.js'
import { CACHE } from './CACHE.js'
import { ref } from 'vue'

const PUBLIC_PATH = './assets/3d'
const sceneList = {
}
const initCameraState = {
  position: {},
  target: {}
}

const clock = new Bol3D.Clock()
const pipelineList = []

// 任务队列 格式见 README
const taskQueue = ref([])



export const STATE = {
  PUBLIC_PATH,
  sceneList,
  initCameraState,
  pipelineList,
  taskQueue,
  clock
}

window.STATE = STATE