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
    const a = UTIL.findPath(125, 2038)
    const b = UTIL.findPath(2034, 2024)
    const filterArr = STATE.pipelineList.filter(e => a.includes(Number(e.name.replace('GuanDao_', ''))) || b.includes(Number(e.name.replace('GuanDao_', ''))))
    console.log(filterArr)
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
