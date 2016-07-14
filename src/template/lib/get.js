import compile from './compile'
import store from './store'


export function getCache(filename) {
  return store.cache[filename];
}

export function getPartial(partial) {
  var partial_filename = 'partial:' + partial;
  var cache = getCache(partial_filename);
  if (!cache) {
    var source = store.partials[partial];
    if (source) {
      // 编译模版片段
      cache = compile(source, {
        filename: partial_filename
      });
    }
  }
  return cache;
}
