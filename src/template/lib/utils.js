import { isArray } from '../../lib/util'
import store from './store'
import { getPartial } from './get'


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

var include = function (partial, data) {
  var fn = getPartial(partial) || showDebugInfo({
    partial: partial,
    name: 'Render Error',
    message: 'Partial not found'
  });
  return data ? fn(data) : fn;
};


export default {
  $helpers: store.helpers,
  $include: include,
  $string: toString,
  $escape: escapeHTML,
  $each: each
};
