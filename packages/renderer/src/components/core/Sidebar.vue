<template>
  <div class="layout-sidebar">
    <p class="title">{{ $t('title') }}</p>

    <div v-for="(item, index) in menuList" :key="index" v-title="item.name" class="menu-item">
      <router-link class="link" role="tab" :to="item.to">
        <i class="icon iconfont" :class="item.icon"></i>
      </router-link>
    </div>
  </div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref } from 'vue';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const menuList = ref([
      {
        to: '/search',
        name: t('sidebar.search'),
        icon: 'icon-search',
      },
      {
        to: '/songList',
        name: t('sidebar.songList'),
        icon: 'icon-song-list',
      },
      {
        to: '/rank',
        name: t('sidebar.rank'),
        icon: 'icon-rank',
      },
      {
        to: '/my',
        name: t('sidebar.my'),
        icon: 'icon-heart',
      },
      {
        to: '/download',
        name: t('sidebar.download'),
        icon: 'icon-download',
      },
      {
        to: '/setting',
        name: t('sidebar.setting'),
        icon: 'icon-setting',
      },
    ]);
    return {
      menuList,
    };
  },
});
</script>

<style lang="less">
.layout-sidebar {
  width: @width-sidebar;
  height: 100%;
  background: @primary-color;
  text-align: center;
  color: @white;
  font-size: @font-size-lg;
  -webkit-app-region: drag;

  .title {
    font-size: 18px;
    line-height: 40px;
    border-bottom: 1px solid rgba(#fff, 0.2);
  }

  .menu-item {
    -webkit-app-region: no-drag;

    .link {
      display: block;
      padding: 16px 8px;
      color: #fff;
      text-decoration: none;
      cursor: pointer;
      &:hover {
        background: @primary-color-hover;
      }
      &.active,
      &:active {
        background: @primary-color-active;
      }
    }
    .icon {
      font-size: 24px;
      line-height: 1;
    }
  }
}
</style>
