import type { RouteRecord } from 'vue-router';

const modules = import.meta.globEager('./modules/**/*.ts');

const routeModuleList: RouteRecord[] = [];

Object.keys(modules).forEach((key) => {
  const mod = modules[key].default || {};
  const modList = Array.isArray(mod) ? [...mod] : [mod];
  routeModuleList.push(...modList);
});

// Basic routing without permission
export const basicRoutes = [];

export const asyncRoutes = [...routeModuleList];
