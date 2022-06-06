import { createApp } from 'vue';
import App from './App.vue';
import '@styles/index.less';

import router from '@/router';
import i18n from './plugins/i18n';
import { setupGlobDirectives } from './directives';
import FloatingVue from 'floating-vue';
import 'floating-vue/dist/style.css';

const app = createApp(App);
setupGlobDirectives(app);
app
  .use(router)
  .use(i18n)
  .use(FloatingVue, {
    strategy: 'fixed',
    themes: {
      'title-tooltip': {
        $extend: 'tooltip',
        placement: 'bottom-right',
        hideTriggers: [],
        disposeTimeout: 500000,
        arrowPadding: -20,
        arrowOverflow: true,
        delay: {
          show: 500,
          hide: 0,
        },
      },
    },
  })
  .mount('#app')
  .$nextTick(window.removeLoading);
