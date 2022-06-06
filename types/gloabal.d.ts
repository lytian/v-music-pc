declare module '*.vue' {
  import { defineComponent } from 'vue';
  const Component: ReturnType<typeof defineComponent>;
  export default Component;
}

/* eslint-disable no-unused-vars */
interface Window {
  removeLoading: () => void;
  i18n: any;
}

declare interface Fn<T = any, R = T> {
  (...arg: T[]): R;
}
