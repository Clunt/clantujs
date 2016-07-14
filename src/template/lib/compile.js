import { extend } from '../../lib/util'
import store from './store'
import { defaults } from '../config'
import { showDebugInfo } from './error'
import compiler from './compiler'


/**
 * 编译模板
 * @param  {String} source  模板字符串
 * @param  {Object} options 编译选项
 *
 *      - openTag       {String}
 *      - closeTag      {String}
 *      - filename      {String}
 *      - escape        {Boolean}
 *      - compress      {Boolean}
 *      - debug         {Boolean}
 *      - cache         {Boolean}
 *      - parser        {Function}
 *
 * @return {Function}  渲染方法
 */
function compile(source, options) {
  // 合并默认配置
  options = extend({}, defaults, options);

  var filename = options.filename;
  try {
    var Render = compiler(source, options);
  } catch (e) {
    e.filename = filename || 'anonymous';
    e.name = 'Syntax Error';
    return showDebugInfo(e);
  }

  // 对编译结果进行一次包装
  function render(data) {
    try {
      return new Render(data) + '';
    } catch (e) {
      return showDebugInfo(e)();
    }
  }

  render.prototype = Render.prototype;
  render.toString = function() {
    return Render.toString();
  };

  if (filename && options.cache) {
    store.cache[filename] = render;
  }

  return render;
};

export default compile
