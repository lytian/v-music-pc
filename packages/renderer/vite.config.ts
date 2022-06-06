import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import resolve from 'vite-plugin-resolve';
import electron from 'vite-plugin-electron/renderer';
import vueI18n from '@intlify/vite-plugin-vue-i18n';
import path from 'path';
import pkg from '../../package.json';

// https://vitejs.dev/config/
export default defineConfig({
  mode: process.env.NODE_ENV,
  root: __dirname,
  plugins: [
    vue(),
    electron(),
    resolve(
      /**
       * Here you can specify other modules
       * 🚧 You have to make sure that your module is in `dependencies` and not in the` devDependencies`,
       *    which will ensure that the electron-builder can package it correctly
       */
      {
        // If you use electron-store, this will work
        'electron-store': 'const Store = require("electron-store"); export default Store;',
      },
    ),
    /** https://github.com/intlify/bundle-tools/tree/main/packages/vite-plugin-vue-i18n */
    vueI18n({
      include: path.resolve(__dirname, '../../lang/**'),
    }),
  ],
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
  },
  resolve: {
    alias: [
      {
        find: /@\//,
        replacement: path.resolve(__dirname, './src/') + '/',
      },
      {
        find: /@styles\//,
        replacement: path.resolve(__dirname, '../../styles') + '/',
      },
      {
        find: 'vue-i18n',
        replacement: 'vue-i18n/dist/vue-i18n.cjs.js',
      },
    ],
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import '@styles/variables.less';`,
        javascriptEnabled: true,
      },
    },
  },
});
