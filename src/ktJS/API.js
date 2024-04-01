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
  console.log('obj: ', obj);
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

  TWEEN.update()
}

export const API = {
  handleInitModel,
  doubleClickFunc,
  hoverFunc,
  render
}
