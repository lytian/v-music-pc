<script setup lang="ts">
import Sidebar from './components/core/Sidebar.vue';
import ToolBar from './components/core/ToolBar.vue';
import kwSource from './utils/music/source/kw';

kwSource.api.getTags().then((res) => {
  console.log(res);
});

kwSource.api.getPlaylist('hot', '1-43', 1).then((res) => {
  console.log(res);
  kwSource.api.getPlaylistDetail(res.list[24].id, 1, 10).then((res) => {
    console.log(res);
  });
});
</script>

<template>
  <Sidebar></Sidebar>
  <div class="layout-main">
    <ToolBar></ToolBar>
    <router-view></router-view>
  </div>
</template>

<style lang="less">
#app {
  width: 100vw;
  height: 100vh;
  border-radius: @border-radius;
  display: flex;
  background: @background-color;
  overflow: hidden;

  .layout-main {
    display: flex;
    flex-direction: column;
  }
}
</style>
