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

export const STATE = {
  PUBLIC_PATH,
  sceneList,
  initCameraState
}

window.STATE = STATE