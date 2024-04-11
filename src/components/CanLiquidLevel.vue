<template>
  <div class="container">
    <div class="inner">
      <div class="c1"></div>
      <div class="c2" :style="{ height: sliderValue + '%' }"></div>
    </div>
    <div class="c3"></div>
    <div class="c4"></div>
  </div>

  <el-slider class="c5" v-model="sliderValue"></el-slider>
</template>

<script setup>
import { ref } from 'vue'
const sliderValue = ref(50)
</script>

<style scoped lang="less">
.container {
  position: absolute;
  top: 7%;
  left: 12.5%;
  height: 40%;
  width: 4%;

  .inner {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: end;
  }

  .c1 {
    z-index: 4;
    background: url('/assets/img/3.png') center / 100% 100% no-repeat;
    width: 70%;
    margin-left: 15%;
    height: 4%;
    transform: translateY(60%);
  }

  .c2 {
    z-index: 3;
    height: 100%;
    width: 70%;
    margin-left: 15%;
    margin-bottom: 15%;
    background: url('/assets/img/2.png') center / 100% 100% no-repeat;
  }

  .c3 {
    position: absolute;
    background: url('/assets/img/4.png') center / 100% 100% no-repeat;
    z-index: 5;
    width: 100%;
    height: 4%;
  }

  .c4 {
    position: absolute;
    background: url('/assets/img/1.png') center / 100% 100% no-repeat;
    height: 98%;
    width: 100%;
    transform: translateY(2%);
  }
}

.c5 {
  pointer-events: all;
  position: absolute;
  top: 50%;
  left: 5%;
  width: 20%;
}
</style>