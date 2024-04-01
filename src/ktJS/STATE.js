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
let WJMeshes = []
let saveClickObjects = {
  home: [],
  '201': [],
  '211': []
}
const currentScene = ref('home')

export const STATE = {
  PUBLIC_PATH,
  sceneList,
  WJMeshes,
  currentScene,
  saveClickObjects,
  initCameraState
}

window.STATE = STATE