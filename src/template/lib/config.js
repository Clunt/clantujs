import { isArray } from '../../lib/util'

// TODO
var cacheStore = {};


var defaults = {
  openTag: '<%', // 逻辑语法开始标签
  closeTag: '%>', // 逻辑语法结束标签
  escape: true, // 是否编码输出变量的 HTML 字符
  cache: true, // 是否开启缓存（依赖 options 的 filename 字段）
  compress: false, // 是否压缩输出
  parser: null // 自定义语法格式器 @see: template-syntax.js
};

var toString = function(value, type) {
  if (typeof value !== 'string') {
    type = typeof value;
    if (type === 'number') {
      value += '';
    } else if (type === 'function') {
      value = toString(value.call(value));
    } else {
      value = '';
    }
  }
  return value;
};

var escapeMap = {
  "<": "&#60;",
  ">": "&#62;",
  '"': "&#34;",
  "'": "&#39;",
  "&": "&#38;"
};

var escapeFn = function(s) {
  return escapeMap[s];
};

var escapeHTML = function(content) {
  return toString(content).replace(/&(?![\w#]+;)|[<>"']/g, escapeFn);
};

var each = function(data, callback) {
  var i, len;
  if (isArray(data)) {
    for (i = 0, len = data.length; i < len; i++) {
      callback.call(data, data[i], i, data);
    }
  } else {
    for (i in data) {
      callback.call(data, data[i], i);
    }
  }
};


export { defaults }

export default {
  $helpers: {},
  $include: 'TODO',
  $string: toString,
  $escape: escapeHTML,
  $each: each
}
