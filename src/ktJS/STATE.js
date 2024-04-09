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

const pipelineMaterial = {
  blue: null,
  red: null,
  both: null
}

const pipelineList = []

// 任务队列
const taskQueue = []



export const STATE = {
  PUBLIC_PATH,
  sceneList,
  initCameraState,
  pipelineMaterial,
  pipelineList,
  clock
}

window.STATE = STATE