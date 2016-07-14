import { isArray } from '../lib/util'


var defaults = {
  openTag: '{{', // 逻辑语法开始标签
  closeTag: '}}', // 逻辑语法结束标签
  escape: true, // 是否编码输出变量的 HTML 字符
  cache: true, // 是否开启缓存（依赖 options 的 filename 字段）
  compress: false, // 是否压缩输出
  parser: null // 自定义语法格式器
};

var filtered = function(js, filter) {
  var parts = filter.split(':');
  var name = parts.shift();
  var args = parts.join(':') || '';

  if (args) {
    args = ', ' + args;
  }

  return '$helpers.' + name + '(' + js + args + ')';
}


defaults.parser = function(code, options) {
  code = code.replace(/^\s/, '');

  var split = code.split(' ');
  var key = split.shift();
  var args = split.join(' ');

  switch (key) {
    case 'if':
      code = 'if(' + args + '){';
      break;
    case 'else':
      if (split.shift() === 'if') {
        split = ' if(' + split.join(' ') + ')';
      } else {
        split = '';
      }
      code = '}else' + split + '{';
      break;
    case '/if':
      code = '}';
      break;
    case 'each':
      var object = split[0] || '$data';
      var as = split[1] || 'as';
      var value = split[2] || '$value';
      var index = split[3] || '$index';
      var param = value + ',' + index;
      if (as !== 'as') {
        object = '[]';
      }
      code = '$each(' + object + ',function(' + param + '){';
      break;
    case '/each':
      code = '});';
      break;
    case 'echo':
      code = 'print(' + args + ');';
      break;
    case 'print':
    case 'include':
      code = key + '(' + split.join(',') + ');';
      break;
    default:
      // 过滤器（辅助方法）
      // {{value | filterA:'abcd' | filterB}}
      // >>> $helpers.filterB($helpers.filterA(value, 'abcd'))
      // TODO: {{ddd||aaa}} 不包含空格
      if (/^\s*\|\s*[\w\$]/.test(args)) {
        var escape = true;
        // {{#value | link}}
        if (code.indexOf('#') === 0) {
          code = code.substr(1);
          escape = false;
        }

        var i = 0;
        var array = code.split('|');
        var len = array.length;
        var val = array[i++];
        for (; i < len; i++) {
          val = filtered(val, array[i]);
        }
        code = (escape ? '=' : '=#') + val;
      } else {
        code = '=' + code;
      }
      break;
  }

  return code;
};


export { defaults }
