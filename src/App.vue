<script setup lang="ts">
import Scene from "@/views/Scene.vue";
import Progress from "@/components/Progress.vue";
</script>

<template>
  <Scene />
  <router-view></router-view>
  <Progress></Progress>
  <p class="version">Version 0.1.0</p>
</template>

<style scoped>
:global(#app) {
  width: 100vw;
  height: 100vh;
  background-color: #999;
  pointer-events: none;
}

.version {
  position: absolute;
  right: 0;
  bottom: 0;
  color: #FFF;
  font-size: 12px;
  z-index: 2;
}
</style>
