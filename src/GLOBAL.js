import { ref } from 'vue'


export const GLOBAL = {
  loadingPercent: ref(0),
  loadedModelNum: 0,
  modelNum: 1
}
window.GLOBAL = GLOBAL