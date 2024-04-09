<script setup>
import { onMounted, ref } from "vue";
import * as echarts from "echarts";
import { STATE } from '@/ktJS/STATE.js'
import { DATA } from '@/ktJS/DATA.js'
import { API } from '@/ktJS/API.js'
import { UTIL } from '@/ktJS/UTIL.js'

function handleBtn(id) {
  API.pipeLineReset()
  if (id === 1) {
    const data = DATA.pipelineMap.zhonghua
    const randomBoatPort = data.boatPort[Math.floor(Math.random() * data.boatPort.length)]
    const randomTransferStation = Math.random() > 0.5 ? data.originOil : data.finishedOil
    const toCanPipelineArr = STATE.pipelineList.filter(e => Number(e.name.replace('GuanDao_', '') >= 2000))
    const randomToCanPipeline = toCanPipelineArr[Math.floor(Math.random() * toCanPipelineArr.length)]
    
    console.log('randomBoatPort: ', randomBoatPort);
    console.log('randomTransferStation: ', randomTransferStation);
    console.log('randomToCanPipeline: ', Number(randomToCanPipeline.name.replace('GuanDao_', '')));
    const toTransferStation = UTIL.findPath(randomBoatPort, randomTransferStation[0])
    const toCan = UTIL.findPath(randomTransferStation[1], Number(randomToCanPipeline.name.replace('GuanDao_', '')))
    console.log('toTransferStation: ', toTransferStation);
    console.log('toCan: ', toCan);
    const filterArr = STATE.pipelineList.filter(e => toTransferStation.includes(Number(e.name.replace('GuanDao_', ''))) || toCan.includes(Number(e.name.replace('GuanDao_', ''))))
    filterArr.forEach(e => {
      e.materialType = 'flow'
    })

  } else if (id === 2) {


  } else if (id === 3) {

  }
}

</script>

<template>
  <div class="home">
    <el-button class="btn" @click="handleBtn(1)">泊位1到原油库</el-button>
    <el-button class="btn" @click="handleBtn(2)">原油库到油罐1</el-button>
    <el-button class="btn" @click="handleBtn(3)">原油库到油罐2</el-button>
  </div>
</template>

<style scoped>
.home {
  width: 100%;
  height: 100%;
  z-index: 2;
  position: absolute;
}

.btn {
  pointer-events: all;
}
</style>
