import { API } from './API.js'
import { CACHE } from './CACHE.js'
import { ref } from 'vue'

const PUBLIC_PATH = './assets/3d'
const sceneList = {
  water: null // 水面
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

export const STATE = {
  PUBLIC_PATH,
  sceneList,
  initCameraState,
  pipelineMaterial,
  pipelineList,
  clock
}

window.STATE = STATE