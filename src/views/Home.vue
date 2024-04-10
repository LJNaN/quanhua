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
    API.randomTask()

  } else if (id === 2) {
    if(STATE.taskQueue.value.length) {
      API.removeTask(STATE.taskQueue.value[Math.floor(Math.random() * STATE.taskQueue.value.length)])
    }
  }
}

</script>

<template>
  <div class="home">
    <el-button class="btn" @click="handleBtn(1)">青兰山_中化 随机增加任务</el-button>
    <el-button class="btn" @click="handleBtn(2)">青兰山_中化 随机删除任务</el-button>
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
