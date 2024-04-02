<script setup>
import { onMounted, ref } from "vue";
import * as echarts from "echarts";
import { STATE } from '@/ktJS/STATE.js'
import { DATA } from '@/ktJS/DATA.js'
import { API } from '@/ktJS/API.js'

function handleBtn(id) {
  API.pipeLineReset()
  if (id === 1) {
    const pipelineMap = DATA.pipelineMap.find(e => e.name === 'part1ToCrudeOilStation')
    const filterArr = STATE.pipelineList.filter(e => pipelineMap.path.includes(Number(e.name.split('_')[1])))
    filterArr.forEach(e => {
      e.materialType = 'blue'
    })

  } else if (id === 2) {
    const pipelineMap = DATA.pipelineMap.find(e => e.name === 'crudeOilStationToStorage1')
    const filterArr = STATE.pipelineList.filter(e => pipelineMap.path.includes(Number(e.name.split('_')[1])))
    filterArr.forEach(e => {
      e.materialType = 'blue'
    })

  } else if (id === 3) {
    const pipelineMap = DATA.pipelineMap.find(e => e.name === 'crudeOilStationToStorage2')
    const filterArr = STATE.pipelineList.filter(e => pipelineMap.path.includes(Number(e.name.split('_')[1])))
    filterArr.forEach(e => {
      e.materialType = 'blue'
    })
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
