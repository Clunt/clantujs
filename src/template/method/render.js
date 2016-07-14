import compile from '../lib/compile'


/**
 * 渲染模版
 * @name   template.render
 * @param  {String} source  模版
 * @param  {Object} data    数据
 * @param  {Object} options 配置参数
 * @return {String}         渲染好的字符串
 */
export default function render(source, data, options) {
  var render = compile(source, options);
  return render(data);
};
