import { defaults } from './config'
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
  options = options || {};
  for (var name in defaults) {
    if (options[name] === undefined) {
      options[name] = defaults[name];
    }
  }

  try {
    var Render = compiler(source, options);
  } catch (e) {
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

  return render;
};

export default compile
