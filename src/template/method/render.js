import compile from '../lib/compile'
import store from '../lib/store'
import { getCache } from '../lib/get'


/**
 * 渲染模版
 * @name   template.render
 * @param  {String} source  模版
 * @param  {Object} data    数据
 * @param  {Object} options 配置参数
 * @return {String}         渲染好的字符串
 */
export default function render(source, data, options) {
  if (typeof options === 'string') {
    options = {
      filename: options
    };
  }
  options = options || {};
  if (options.cache === false) {
    store[options.filename] = undefined;
  }
  var render = getCache(options.filename) || compile(source, options);
  return render(data);
};
