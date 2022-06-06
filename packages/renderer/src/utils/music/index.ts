const modules = import.meta.globEager('./source/**/*.ts');

const sourceApiList: MusicSource[] = [];

Object.keys(modules).forEach((key) => {
  const mod = modules[key].default || {};
  const modList = Array.isArray(mod) ? [...mod] : [mod];
  sourceApiList.push(...modList);
});
