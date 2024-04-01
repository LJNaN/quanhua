const newTree = treeArr[0].clone()
CACHE.container.scene.add(newTree)
UTIL.setModelPosition(newTree)


window.b = []
window.a = function () {
  b.push([newTree.position.x, newTree.position.z])
}
window.c = function () {
  b = []
}

document.onkeydown = function (e) {
  var keyNum = window.event ? e.keyCode : e.which;
  if (keyNum == 79) {
    a()
    console.log(b)
  } else if (keyNum == 80) {
    c()
  }
}




// UTIL.instantiationSingleInfo(treeArr, 'tree')
// const ground = model.children.find(e => e.name.includes('di009'))
// const ground2 = model.children.find(e => e.name.includes('neicao'))
// if (ground) {
//   ground.children.forEach(e => {
//     if (e.isMesh && e.name.includes('Line')) {
//       console.log('e: ', e);
//       const edgeArr = []
//       for (let i = 0; i < e.geometry.attributes.position.array.length; i += 3) {
//         const edgeTemp = e.geometry.attributes.position.array.slice(i, i + 3)
//         const edge = [
//           (edgeTemp[0] + e.position.x + e.parent.position.x) * DATA.sceneScale,
//           (edgeTemp[2] + e.position.z + e.parent.position.z) * DATA.sceneScale
//         ]
//         edgeArr.push(edge)
//       }
//       DATA.groundEdgeArr.push(edgeArr)
//     }
//   })
// }

// if (ground2) {
//   const line505 = ground2.children.find(e => e.name === 'Line505')
//   line505 && line505.children.forEach(e => {
//     if (e.isMesh) {
//       evt.clickObjects.push(e)
//     }
//   })
// }