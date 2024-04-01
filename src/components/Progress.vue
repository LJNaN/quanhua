<template>
  <div class="main" v-if="GLOBAL.loadingPercent.value !== 100">
    <el-progress
      class="progress"
      :percentage="GLOBAL.loadingPercent.value"
      :stroke-width="10"
      striped
      striped-flow
      color="#67c23a"
    />
  </div>
</template>

<script setup>
import { GLOBAL } from "@/GLOBAL";
</script>

<style lang="less" scoped>
.main {
  position: absolute;
  height: 100vh;
  width: 100vw;
  z-index: 2;
  background-color: #17171a;
  display: flex;
  align-items: center;
  justify-content: center;

  .progress {
    width: 30%;
  }
}

:deep(.el-progress__text) {
  color: #ffffff;
}
</style>
