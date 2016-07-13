import utils from './utils'
import compile from './compile'

function template(source, options) {
}

var cacheStore = template.cache = {};

var defaults = template.defaults = {
  openTag: '<%', // 逻辑语法开始标签
  closeTag: '%>', // 逻辑语法结束标签
  escape: true, // 是否编码输出变量的 HTML 字符
  cache: true, // 是否开启缓存（依赖 options 的 filename 字段）
  compress: false, // 是否压缩输出
  parser: null // 自定义语法格式器 @see: template-syntax.js
};

/**
 * 渲染模板
 * @name    template.render
 * @param   {String}    模板
 * @param   {Object}    数据
 * @return  {String}    渲染好的字符串
 */
template.render = function(source, options) {
  return compile(source, options);
};

/**
 * 添加模板辅助方法
 * @name    template.helper
 * @param   {String}    名称
 * @param   {Function}  方法
 */
template.helper = function(name, helper) {
  utils.$helpers[name] = helper;
};

/**
 * 添加模板片段
 * @name    template.partial
 * @param   {String}    名称
 * @param   {Function}  方法
 */
template.partial = function(name, partial) {
  utils.$partials[name] = partial;
};


export default template
