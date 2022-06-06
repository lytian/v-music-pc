import type { Directive } from 'vue';
import type { VirtualElement, Instance } from '@popperjs/core';
import { createPopper } from '@popperjs/core';

function generateGetBoundingClientRect(x = 0, y = 0) {
  return (): DOMRect => ({
    top: y,
    right: x,
    bottom: y,
    left: x,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    toJSON: () => '',
  });
}

const virtualElement: VirtualElement = {
  getBoundingClientRect: generateGetBoundingClientRect(),
};

let instance: Instance | null;
let createTimer: number | null;
let destoryTimer: number | null;

const titleDirective: Directive = {
  mounted(el: HTMLElement, binding: any) {
    el.onmouseenter = function () {
      if (createTimer) {
        clearTimeout(createTimer);
      }
      createTimer = setTimeout(() => {
        let popperDom = document.getElementById('v-title-popper');
        if (popperDom == null) {
          popperDom = document.createElement('div');
          popperDom.style.cssText = `
            background: #fff;
            color: #333;
            box-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
            border-radius: 3px;
            padding: 4px 6px;
            display: inline-block;
            font-size: 12px;
            z-index: 999;
          `;
          popperDom.setAttribute('id', 'v-title-popper');
          document.body.appendChild(popperDom);
        }
        popperDom.innerText = binding.value;
        if (instance == null) {
          instance = createPopper(virtualElement, popperDom, {
            placement: 'bottom-start',
          });
        }
        if (destoryTimer) {
          clearTimeout(destoryTimer);
          destoryTimer = null;
        }
      }, 300);
    };
    el.onmousemove = function (e: MouseEvent) {
      if (destoryTimer) {
        clearTimeout(destoryTimer);
        destoryTimer = null;
      }
      virtualElement.getBoundingClientRect = generateGetBoundingClientRect(e.x + 12, e.y + 12);
      instance?.update();
    };
    // 鼠标移出时将浮层元素销毁
    el.onmouseleave = function () {
      if (createTimer) {
        clearTimeout(createTimer);
        createTimer = null;
      }
      if (destoryTimer) {
        clearTimeout(destoryTimer);
      }
      instance?.destroy();
      instance = null;
      destoryTimer = setTimeout(() => {
        const popperDom = document.getElementById('v-title-popper');
        popperDom && document.body.removeChild(popperDom);
      }, 5000);
    };
  },
};

export default titleDirective;
