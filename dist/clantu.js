/*!
 * Clantujs v2.1.0
 * (c) 2016 Clunt
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Clantu = factory());
}(this, function () { 'use strict';

  var config = {
    debug: false,
    listener: {
      root: null,
      history: false
    }
  }

  var toString = {}.toString;

  function bindEvent(elem, eventName, eventHandle) {
    if (elem && elem.addEventListener) {
      elem.addEventListener(eventName, eventHandle, false);
    } else if (elem && elem.attachEvent) {
      elem.attachEvent('on' + eventName, eventHandle);
    }
  }

  var removeEvent = document.removeEventListener ? function(elem, eventName, eventHandle) {
    if (elem.removeEventListener) {
      elem.removeEventListener(eventName, eventHandle, false);
    }
  } : function(elem, eventName, eventHandle) {
    var name = 'on' + type;
    if (elem.detachEvent) {
      if ('undefined' === typeof elem[name]) {
        elem[name] = null;
      }
      elem.detachEvent(name, eventHandle);
    }
  };

  function preventDefault(evt) {
    // If preventDefault exists, run it on the original event
    if ( evt.preventDefault ) {
      evt.preventDefault();
    // Support: IE
    // Otherwise set the returnValue property of the original event to false
    } else {
      evt.returnValue = false;
    }
  }

  var isArray = Array.isArray || function (arr) {
    return toString.call(arr) == '[object Array]';
  };

  function extend(obj) {
    obj = typeof obj === 'object' ? obj : {};

    var args = arguments;
    if (args.length > 1) {
      for (var i = 1; i < args.length; i++) {
        var arg = args[i];
        if (typeof arg === 'object' && !isArray(arg)) {
          for (var key in arg) {
            if (arg.hasOwnProperty(key)) {
              var value = arg[key];
              obj[key] = typeof value === 'object' ? extend(obj[key], value) : value;
            }
          }
        }
      }
    }
    return obj;
  }

  /**
   * The main path matching regexp utility.
   *
   * @type {RegExp}
   */
  var PATH_REGEXP = new RegExp([
    // Match escaped characters that would otherwise appear in future matches.
    // This allows the user to escape special characters that won't transform.
    '(\\\\.)',
    // Match Express-style parameters and un-named parameters with a prefix
    // and optional suffixes. Matches appear as:
    //
    // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
    // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
    // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
    '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'
  ].join('|'), 'g')

  /**
   * Parse a string for the raw tokens.
   *
   * @param  {string} str
   * @return {!Array}
   */
  function parse (str) {
    var tokens = []
    var key = 0
    var index = 0
    var path = ''
    var res

    while ((res = PATH_REGEXP.exec(str)) != null) {
      var m = res[0]
      var escaped = res[1]
      var offset = res.index
      path += str.slice(index, offset)
      index = offset + m.length

      // Ignore already escaped sequences.
      if (escaped) {
        path += escaped[1]
        continue
      }

      var next = str[index]
      var prefix = res[2]
      var name = res[3]
      var capture = res[4]
      var group = res[5]
      var modifier = res[6]
      var asterisk = res[7]

      // Push the current path onto the tokens.
      if (path) {
        tokens.push(path)
        path = ''
      }

      var partial = prefix != null && next != null && next !== prefix
      var repeat = modifier === '+' || modifier === '*'
      var optional = modifier === '?' || modifier === '*'
      var delimiter = res[2] || '/'
      var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?')

      tokens.push({
        name: name || key++,
        prefix: prefix || '',
        delimiter: delimiter,
        optional: optional,
        repeat: repeat,
        partial: partial,
        asterisk: !!asterisk,
        pattern: escapeGroup(pattern)
      })
    }

    // Match any characters still remaining.
    if (index < str.length) {
      path += str.substr(index)
    }

    // If the path exists, push it onto the end.
    if (path) {
      tokens.push(path)
    }

    return tokens
  }

  /**
   * Escape a regular expression string.
   *
   * @param  {string} str
   * @return {string}
   */
  function escapeString (str) {
    return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1')
  }

  /**
   * Escape the capturing group by escaping special characters and meaning.
   *
   * @param  {string} group
   * @return {string}
   */
  function escapeGroup (group) {
    return group.replace(/([=!:$\/()])/g, '\\$1')
  }

  /**
   * Attach the keys as a property of the regexp.
   *
   * @param  {!RegExp} re
   * @param  {Array}   keys
   * @return {!RegExp}
   */
  function attachKeys (re, keys) {
    re.keys = keys
    return re
  }

  /**
   * Get the flags for a regexp from the options.
   *
   * @param  {Object} options
   * @return {string}
   */
  function flags (options) {
    return options.sensitive ? '' : 'i'
  }

  /**
   * Pull out keys from a regexp.
   *
   * @param  {!RegExp} path
   * @param  {!Array}  keys
   * @return {!RegExp}
   */
  function regexpToRegexp (path, keys) {
    // Use a negative lookahead to match only capturing groups.
    var groups = path.source.match(/\((?!\?)/g)

    if (groups) {
      for (var i = 0; i < groups.length; i++) {
        keys.push({
          name: i,
          prefix: null,
          delimiter: null,
          optional: false,
          repeat: false,
          partial: false,
          asterisk: false,
          pattern: null
        })
      }
    }

    return attachKeys(path, keys)
  }

  /**
   * Transform an array into a regexp.
   *
   * @param  {!Array}  path
   * @param  {Array}   keys
   * @param  {!Object} options
   * @return {!RegExp}
   */
  function arrayToRegexp (path, keys, options) {
    var parts = []

    for (var i = 0; i < path.length; i++) {
      parts.push(pathToRegexp(path[i], keys, options).source)
    }

    var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options))

    return attachKeys(regexp, keys)
  }

  /**
   * Create a path regexp from string input.
   *
   * @param  {string}  path
   * @param  {!Array}  keys
   * @param  {!Object} options
   * @return {!RegExp}
   */
  function stringToRegexp (path, keys, options) {
    var tokens = parse(path)
    var re = tokensToRegExp(tokens, options)

    // Attach keys back to the regexp.
    for (var i = 0; i < tokens.length; i++) {
      if (typeof tokens[i] !== 'string') {
        keys.push(tokens[i])
      }
    }

    return attachKeys(re, keys)
  }

  /**
   * Expose a function for taking tokens and returning a RegExp.
   *
   * @param  {!Array}  tokens
   * @param  {Object=} options
   * @return {!RegExp}
   */
  function tokensToRegExp (tokens, options) {
    options = options || {}

    var strict = options.strict
    var end = options.end !== false
    var route = ''
    var lastToken = tokens[tokens.length - 1]
    var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken)

    // Iterate over the tokens and create our regexp string.
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i]

      if (typeof token === 'string') {
        route += escapeString(token)
      } else {
        var prefix = escapeString(token.prefix)
        var capture = '(?:' + token.pattern + ')'

        if (token.repeat) {
          capture += '(?:' + prefix + capture + ')*'
        }

        if (token.optional) {
          if (!token.partial) {
            capture = '(?:' + prefix + '(' + capture + '))?'
          } else {
            capture = prefix + '(' + capture + ')?'
          }
        } else {
          capture = prefix + '(' + capture + ')'
        }

        route += capture
      }
    }

    // In non-strict mode we allow a slash at the end of match. If the path to
    // match already ends with a slash, we remove it for consistency. The slash
    // is valid at the end of a path match, not in the middle. This is important
    // in non-ending mode, where "/test/" shouldn't match "/test//route".
    if (!strict) {
      route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?'
    }

    if (end) {
      route += '$'
    } else {
      // In non-ending mode, we need the capturing groups to match as much as
      // possible by using a positive lookahead to the end or next path segment.
      route += strict && endsWithSlash ? '' : '(?=\\/|$)'
    }

    return new RegExp('^' + route, flags(options))
  }

  /**
   * Normalize the given path string, returning a regular expression.
   *
   * An empty array can be passed in for the keys, which will hold the
   * placeholder key descriptions. For example, using `/user/:id`, `keys` will
   * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
   *
   * @param  {(string|RegExp|Array)} path
   * @param  {(Array|Object)=}       keys
   * @param  {Object=}               options
   * @return {!RegExp}
   */
  function pathToRegexp (path, keys, options) {
    keys = keys || []

    if (!isArray(keys)) {
      options = /** @type {!Object} */ (keys)
      keys = []
    } else if (!options) {
      options = {}
    }

    if (path instanceof RegExp) {
      return regexpToRegexp(path, /** @type {!Array} */ (keys))
    }

    if (isArray(path)) {
      return arrayToRegexp(/** @type {!Array} */ (path), /** @type {!Array} */ (keys), options)
    }

    return stringToRegexp(/** @type {string} */ (path), /** @type {!Array} */ (keys), options)
  }

  function Route(path) {
    this.path = '*' === path ? '(.*)' : path;
    this.keys = [];
    this.regexp = pathToRegexp(this.path, this.keys);
  }

  Route.prototype.middleware = function(fn) {
    var self = this;
    return function(ctx, next) {
      if (self.match(ctx, ctx.$params)) return fn(ctx, next);
      next();
    };
  };

  Route.prototype.match = function(ctx, params) {
    var keys = this.keys;
    var pathname = ctx.$pathname;
    var m = this.regexp.exec(pathname);

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];
      var val = m[i];
      if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
        params[key.name] = val;
      }
    }

    return true;
  };

  function querystring(querystring) {
    var ret = {};
    var query_arr = querystring.split('&');
    for (var i = 0; i < query_arr.length; i++) {
      var param = query_arr[i];
      if (param.length === 0) {
        continue;
      }
      var parts = param.split('=');

      var key = parts.shift();
      var val = parts.length > 0 ? parts.join('=') : undefined;
      val = val === undefined ? null : val;

      if (ret[key] === undefined) {
        ret[key] = val;
      } else if (isArray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }
    };
    return ret;
  }

  var store = {
    cache: {},
    helpers: {},
    partials: {}
  };

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

  function onerror(e) {
    var message = 'Template Error\n\n';
    for (var name in e) {
      message += '<' + name + '>\n' + e[name] + '\n\n';
    }
    if (config.debug && typeof console === 'object') {
      console.error(message);
    }
  }

  // 模板调试器
  var showDebugInfo$1 = function(e) {
    onerror(e);
    return function() {
      return '{Template Error}';
    };
  };

  function getCache(filename) {
    return store.cache[filename];
  }

  function getPartial(partial) {
    var partial_filename = 'partial:' + partial;
    var cache = getCache(partial_filename);
    if (!cache) {
      var source = store.partials[partial];
      if (source) {
        // 编译模版片段
        cache = compile$1(source, {
          filename: partial_filename
        });
      }
    }
    return cache;
  }

  var toString$1 = function(value, type) {
    if (typeof value !== 'string') {
      type = typeof value;
      if (type === 'number') {
        value += '';
      } else if (type === 'function') {
        value = toString$1(value.call(value));
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
    return toString$1(content).replace(/&(?![\w#]+;)|[<>"']/g, escapeFn);
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


  var utils = {
    $helpers: store.helpers,
    $include: include,
    $string: toString$1,
    $escape: escapeHTML,
    $each: each
  };

  // 数组迭代
  var forEach = utils.$each;

  // 静态分析模板变量
  var KEYWORDS_ARR = [
    // 关键字
    'break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'false', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new', 'null', 'return', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with'
    // 保留字
    , 'abstract', 'boolean', 'byte', 'char', 'class', 'const', 'double', 'enum', 'export', 'extends', 'final', 'float', 'goto', 'implements', 'import', 'int', 'interface', 'long', 'native', 'package', 'private', 'protected', 'public', 'short', 'static', 'super', 'synchronized', 'throws', 'transient', 'volatile'
    // ECMA 5 - use strict
    , 'arguments', 'let', 'yield'
    , 'undefined'
  ];

  var REMOVE_RE = /\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|\s*\.\s*[$\w\.]+/g;
  var SPLIT_RE = /[^\w$]+/g;
  var KEYWORDS_RE = new RegExp(['\\b' + KEYWORDS_ARR.join('\\b|\\b') + '\\b'].join('|'), 'g');
  var NUMBER_RE = /^\d[^,]*|,\d[^,]*/g;
  var BOUNDARY_RE = /^,+|,+$/g;
  var SPLIT2_RE = /^$|,+/;


  // 获取变量
  function getVariable(code) {
    return code
      .replace(REMOVE_RE, '')
      .replace(SPLIT_RE, ',')
      .replace(KEYWORDS_RE, '')
      .replace(NUMBER_RE, '')
      .replace(BOUNDARY_RE, '')
      .split(SPLIT2_RE);
  }


  // 字符串转义
  function stringify(code) {
    return "'" + code
      // 单引号与反斜杠转义
      .replace(/('|\\)/g, '\\$1')
      // 换行符转义(windows + linux)
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n') + "'";
  }


  function compiler(source, options) {
    var debug = config.debug;

    var openTag = options.openTag;
    var closeTag = options.closeTag;
    var parser = options.parser;
    var compress = options.compress;
    var escape = options.escape;

    var line = 1;
    var uniq = {
      $data: 1,
      $filename: 1,
      $utils: 1,
      $helpers: 1,
      $out: 1,
      $line: 1
    };

    // 拼接方式 字符串/数组
    var isNewEngine = ''.trim;
    var replaces = isNewEngine ? ["$out='';", "$out+=", ";", "$out"] : ["$out=[];", "$out.push(", ");", "$out.join('')"];

    // 拼接语句
    var concat = isNewEngine ? "$out+=text;return $out;" : "$out.push(text);";
    var print = "function(){" + "var text=''.concat.apply('',arguments);" + concat + "}";
    var include = "function(filename,data){" + "data=data||$data;" + "var text=$utils.$include(filename,data,$filename);" + concat + "}";

    // 辅助代码
    var headerCode = "'use strict';" + "var $utils=this,$helpers=$utils.$helpers," + (debug ? "$line=0," : "");
    var mainCode = replaces[0];
    var footerCode = "return new String(" + replaces[3] + ");"

    // html与逻辑语法分离
    forEach(source.split(openTag), function(code) {
      code = code.split(closeTag);

      var $0 = code[0];
      var $1 = code[1];

      if (code.length === 1) { // code: [html]
        mainCode += html($0);
      } else { // code: [logic, html]
        mainCode += logic($0);
        if ($1) {
          mainCode += html($1);
        }
      }
    });

    var code = headerCode + mainCode + footerCode;

    // 调试语句
    if (debug) {
      code = "try{" + code + "}catch(e){" + "throw {" + "filename:$filename," + "name:'Render Error'," + "message:e.message," + "line:$line," + "source:" + stringify(source) + ".split(/\\n/)[$line-1].replace(/^\\s+/,'')" + "};" + "}";
    }

    try {
      var Render = new Function('$data', '$filename', code);
      Render.prototype = utils;
      return Render;
    } catch (e) {
      e.temp = 'function anonymous($data,$filename) {' + code + '}';
      throw e;
    }

    // 处理 HTML 语句
    function html(code) {
      // 记录行号
      line += code.split(/\n/).length - 1;

      // 压缩多余空白与注释
      if (compress) {
        code = code
          .replace(/\s+/g, ' ')
          .replace(/<!--[\w\W]*?-->/g, '');
      }

      // 拼接JS代码
      if (code) {
        code = replaces[1] + stringify(code) + replaces[2] + '\n';
      }

      return code;
    }


    // 处理逻辑语句
    function logic(code) {
      var thisLine = line;

      if (parser) {
        // 语法转换插件钩子
        code = parser(code, options);
      } else if (debug) {
        // 记录行号
        code = code.replace(/\n/g, function() {
          line++;
          return '$line=' + line + ';';
        });
      }

      // 输出语句. 编码: <%=value%> 不编码:<%=#value%>
      // <%=#value%> 等同 v2.0.3 之前的 <%==value%>
      if (code.indexOf('=') === 0) {
        var escapeSyntax = escape && !/^=[=#]/.test(code);
        code = code.replace(/^=[=#]?|[\s;]*$/g, '');
        // 对内容编码
        if (escapeSyntax) {
          var name = code.replace(/\s*\([^\)]+\)/, '');
          // 排除 utils.* | include | print
          if (!utils[name] && !/^(include|print)$/.test(name)) {
            code = "$escape(" + code + ")";
          }
        } else { // 不编码
          code = "$string(" + code + ")";
        }
        code = replaces[1] + code + replaces[2];
      }

      if (debug) {
        code = '$line=' + thisLine + ';' + code;
      }

      // 提取模板中的变量名
      forEach(getVariable(code), function(name) {
        // name 值可能为空，在安卓低版本浏览器下
        if (!name || uniq[name]) {
          return;
        }
        var value;
        // 声明模板变量
        // 赋值优先级:
        // [include, print] > utils > data
        if (name === 'print') {
          value = print;
        } else if (name === 'include') {
          value = include;
        } else if (utils[name]) {
          value = '$utils.' + name;
        } else {
          value = '$data.' + name;
        }
        headerCode += name + '=' + value + ',';
        uniq[name] = true;
      });
      return code + '\n';
    }
  };

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
  function compile$1(source, options) {
    // 合并默认配置
    options = extend({}, defaults, options);

    var filename = options.filename;
    try {
      var Render = compiler(source, options);
    } catch (e) {
      e.filename = filename || 'anonymous';
      e.name = 'Syntax Error';
      return showDebugInfo$1(e);
    }

    // 对编译结果进行一次包装
    function render(data) {
      try {
        return new Render(data) + '';
      } catch (e) {
        return showDebugInfo$1(e)();
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

  /**
   * 渲染模版
   * @name   template.render
   * @param  {String} source  模版
   * @param  {Object} data    数据
   * @param  {Object} options 配置参数
   * @return {String}         渲染好的字符串
   */
  function render(source, data, options) {
    if (typeof options === 'string') {
      options = {
        filename: options
      };
    }
    options = options || {};
    if (options.cache === false) {
      store[options.filename] = undefined;
    }
    var render = getCache(options.filename) || compile$1(source, options);
    return render(data);
  };

  /**
   * 添加模板辅助方法
   * @name   template.helper
   * @param  {String}   name   名称
   * @param  {Function} helper 方法
   */
  function helper(name, helper) {
    store.helpers[name] = helper;
  }

  /**
   * 添加模板片段
   * @name   template.helper
   * @param  {String} name    名称
   * @param  {String} partial 模版片段
   */
  function partial(name, partial) {
    store.partials[name] = partial;
  }

  function template(source, options) {
    if (typeof options === 'string') {
      options = {
        filename: options
      };
    }
    options = options || {};
    if (options.cache === false) {
      store[options.filename] = undefined;
    }
    return getCache(options.filename) || compile$1(source, options);
  }

  template.render = render;

  template.helper = helper;

  template.partial = partial;

  function Context(path, state, referer, prev_ctx) {
    var pathname = path;

    var hash_i = pathname.indexOf('#');
    var hash = ~hash_i ? pathname.slice(hash_i + 1) : '';
    pathname = ~hash_i ? pathname.slice(0, hash_i) : pathname;

    var search_i = pathname.indexOf('?');
    var search = ~search_i ? pathname.slice(search_i + 1) : '';
    pathname = ~search_i ? pathname.slice(0, search_i) : pathname;

    var query = querystring(search);

    this.$state = state || {};
    this.$path = path;
    this.$params = {};
    this.$pathname = pathname;
    this.$hash = hash;
    this.$querystring = search;
    this.$query = query;
    this.$referer = referer;

    this.$prev = prev_ctx;

    this.$render = render;
  }

  var PATH_CURRENT = '';
  var CALLBACKS = [];
  var EXITS = [];
  var PREV_CONTEXT;

  function match(path, state) {
    var ctx = new Context(path, state, PATH_CURRENT, PREV_CONTEXT);
    PATH_CURRENT = ctx.$path;
    var prev_ctx = PREV_CONTEXT;
    var callbacks_index = 0;
    var exits_index = 0;

    PREV_CONTEXT = ctx;

    function nextExit() {
      var fn = EXITS[exits_index++];
      if (!fn) return nextEnter();
      fn(prev_ctx, nextExit);
    }

    function nextEnter() {
      var fn = CALLBACKS[callbacks_index++];
      if (ctx.$path !== PATH_CURRENT) return;
      if (!fn) return;
      fn(ctx, nextEnter);
    }

    if (prev_ctx) {
      nextExit();
    } else {
      nextEnter();
    }
    return ctx;
  }

  function register(path, fn) {
    if ('function' === typeof path) {
      return register('*', path);
    }

    if ('function' === typeof fn) {
      var route = new Route(path);
      for (var i = 1; i < arguments.length; ++i) {
        CALLBACKS.push(route.middleware(arguments[i]));
      }
    }
  }

  register.exit = function exit(path, fn) {
    if ('function' === typeof path) {
      return exit('*', path);
    }

    if ('function' === typeof fn) {
      var route = new Route(path);
      for (var i = 1; i < arguments.length; ++i) {
        EXITS.push(route.middleware(arguments[i]));
      }
    }
  };

  var hashChange = (function() {
    var hash_change_support = !(!('onhashchange' in window) && (document.documentMode === undefined || document.documentMode > 7));
    var hash_change_support = false;
    var simulation_id = null;
    var simulation_callbacks = [];
    var hash_callbacks = [];
    function simulation_emit(evt) {
      for (var i = 0; i < hash_callbacks.length; i++) {
        var hash_callback = hash_callbacks[i];
        if ('function' === typeof hash_callback) {
          hash_callback(evt);
        }
      }
    }

    function simulation_start() {
      if (simulation_id) return;
      var location = window.location;
      var oldURL = location.href;
      var oldHash = location.hash;
      simulation_id = setInterval(function() {
        var newURL  = location.href,
            newHash = location.hash;
        if (newHash != oldHash) {
          simulation_emit({
            type: 'hashchange',
            oldURL: oldURL,
            newURL: newURL
          });
          oldURL = newURL;
          oldHash = newHash;
        }
      }, 100);
    }

    var virtual = {
      bind: function(onChange) {
        bindEvent(window, 'hashchange', onChange);
      },
      remove: function(onChange) {
        removeEvent(window, 'hashchange', onChange);
      }
    };

    var simulation = {
      bind: function(onChange) {
        hash_callbacks.push(onChange);
        simulation_start();
      },
      remove: function(onChange) {
        for (var i = 0; i < hash_callbacks.length; i++) {
          if (onChange === hash_callbacks[i](evt)) {
            hash_callbacks[i] = null;
          }
        }
      }
    };

    return hash_change_support ? virtual : simulation;
  }());

  function resolvePath(base, relative) {
    var query = base.match(/(\?.*)$/)
    if (query) {
      query = query[1];
      base = base.slice(0, -query.length);
    }
    if (relative.charAt(0) === '?') {
      return base + relative
    }
    var stack = base.split('/')
    if (!stack[stack.length - 1]) {
      stack.pop();
    }
    var segments = relative.replace(/^\//, '').split('/');
    for (var i = 0; i < segments.length; i++) {
      var segment = segments[i]
      if (segment === '.') {
        continue
      } else if (segment === '..') {
        stack.pop();
      } else {
        stack.push(segment);
      }
    }
    if (stack[0] !== '') {
      stack.unshift('')
    }
    return stack.join('/')
  }

  function HashHistory(option) {
    this.onChange = option.onChange;
  }

  HashHistory.prototype.start = function() {
    var self = this;
    this.listener = function () {
      var path = location.hash;
      var raw = path.replace(/^#!/, '');
      if (raw.charAt(0) !== '/') {
        raw = '/' + raw;
      }
      var formattedPath = self.formatPath(raw);
      if (formattedPath !== path) {
        location.replace(formattedPath);
        return;
      }
      self.onChange(decodeURI(path.replace(/^#!/, '')));
    };
    hashChange.bind(this.listener);
    this.listener();
  };

  HashHistory.prototype.stop = function() {
    hashChange.remove(this.listener);
  };

  HashHistory.prototype.go = function(path, replace) {
    var location = window.location;
    if (path.indexOf('#') === 0) {
      location.hash = '#!' + location.hash.replace(/^#!/, '').replace(/#.*/g, '') + path;
      return;
    }
    path = this.formatPath(path);
    location.hash = path;
  };

  HashHistory.prototype.formatPath = function(path) {
    var prefix = '#!';
    return path.charAt(0) === '/'
      ? prefix + path
      : prefix + resolvePath(location.hash.replace(/^#!/, ''), path);
  };

  function Html5History(option) {
    this.onChange = option.onChange;
    var root = option.root;
    if (option.root) {
      if ('/' !== root.charAt(0)) {
        root = '/' + root;
      }
      this.root = root.replace(/\/$/, '')
      this.rootRE = new RegExp('^\\' + this.root)
    } else {
      this.root = null;
    }
    var baseEl = document.getElementsByTagName('base')[0];
    this.base = baseEl && baseEl.getAttribute('href');
  }

  Html5History.prototype.start = function() {
    var self = this;
    this.listener = function(evt) {
      var url = decodeURI(location.pathname + location.search) + location.hash;
      if (self.root) {
        url = url.replace(self.rootRE, '');
      }
      self.onChange(url, evt && evt.state)
    };
    bindEvent(window, 'popstate', this.listener);
    this.listener();
  };

  Html5History.prototype.stop = function() {
    removeEvent(window, 'popstate', this.listener);
  };

  Html5History.prototype.go = function(path, replace) {
    if (path.indexOf('#') === 0) {
      window.location.hash = path;
      return;
    }
    var url = this.formatPath(path);
    if (replace) {
      history.replaceState({}, '', url);
    } else {
      history.pushState({}, '', url);
    }
    this.onChange(url.replace(this.rootRE, ''), null);
  };

  Html5History.prototype.formatPath = function(path) {
    return path.charAt(0) === '/'
      ? this.root
        ? this.root + '/' + path.replace(/^\//, '')
        : path
      : resolvePath(this.base || location.pathname, path);
  };

  function which(evt) {
    evt = evt || window.event;
    return null === evt.which ? evt.button : evt.which;
  }

  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return (href && (0 === href.indexOf(origin)));
  }

  function Link(option) {
    this.onClick = option.onClick;
  }

  Link.prototype.start = function() {
    var self = this;
    this.listener = function(evt) {
      if (1 !== which(evt)) return;

      if (evt.metaKey || evt.ctrlKey || evt.shiftKey) return;
      if (evt.defaultPrevented) return;


      // ensure link
      var el = evt.target;
      while (el && 'A' !== el.nodeName) el = el.parentNode;
      if (!el || 'A' !== el.nodeName) return;



      // Ignore if tag has
      // 1. "download" attribute
      // 2. rel="external" attribute
      if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

      var link = el.getAttribute('href');

      // Check for mailto: in the href
      if (link && link.indexOf('mailto:') > -1) return;

      // check target
      if (el.target) return;

      // x-origin
      if (!sameOrigin(el.href)) return;


      // rebuild path
      var path = el.pathname + el.search + (el.hash || '');


      preventDefault(evt);
      self.onClick(link);
    };
    bindEvent(document, 'click', this.listener);
  };

  Link.prototype.stop = function() {
    removeEvent(document, 'click', this.listener);
  };

  var historyBackends = {
    hash: HashHistory,
    html5: Html5History
  };


  function Listener(option, callback) {
    option = option || {};
    var self = this;

    var root = 'undefined' === typeof option.root ? null : option.root;
    this.root = root;

    // Check if HTML5 history is available
    var hasPushState = typeof window !== 'undefined' && window.history && window.history.pushState;
    this._history = option.history && hasPushState;
    this._historyFallback = option.history && !hasPushState;

    this.mode = this._history ? 'html5' : 'hash';
    var History = historyBackends[this.mode];

    this.history = new History({
      root: root,
      onChange: callback
    });

    this.link = new Link({
      onClick: function(path) {
        self.history.go(path);
      }
    });
  }

  Listener.prototype.start = function() {
    var location = window.location;

    // handle history fallback in browsers that do not support HTML5 history API
    if (this._historyFallback) {
      var history = new Html5History({ root: this.root });
      var path = history.root ? location.pathname.replace(history.rootRE, '') : location.pathname;
      if ((path && path !== '/') || location.search) {
        var formatPath = this.history.formatPath(path);
        location.assign(
          (history.root || '') + '/' +
          this.history.formatPath(path) +
          location.search +
          location.hash
        );
        return;
      }
    }

    // handle history enhance in browsers that support HTML5 history API
    if (this._history) {
      var url = location.pathname.replace(/\/$/, '') + '/' + location.search + location.hash;
      var urlRE = new RegExp('^\\' + this.history.root + '\/#!/')
      if (urlRE.test(url)) {
        location.assign(
          (this.history.root || '') + '/' +
          location.hash.replace(/^#!\/?/, '')
        );
        return;
      }
    }

    this.history.start();
    this.link.start();
  };

  Listener.prototype.stop = function() {
    this.history.stop();
    this.link.stop();
    this.running = false;;
  };

  var app = null;
  var router = register;

  function Clantu(option) {
    option = extend(config, option);

    var self = this;
    this.running = false;
    this.listener = new Listener(option.listener, function(path, state) {
      match(path, state);
    });
  }

  Clantu.prototype.router = router;

  Clantu.prototype.template = template;

  Clantu.prototype.render = render;

  Clantu.prototype.start = function(option) {
    if (this.running) return;
    this.running = true;
    this.listener.start();
  };

  Clantu.prototype.stop = function() {
    this.listener.stop();
    this.running = false;;
  };

  Clantu.prototype.show = function(path) {
    match(path);
  };

  Clantu.prototype.go = function(path) {
    this.listener.history.go(path);
  };

  Clantu.prototype.replace = function(path) {
    this.listener.history.go(path, true);
  };


  function exports$1(option) {
    return app || ( app = new Clantu(option) );
  }

  exports$1.router = router;
  exports$1.template = template;
  exports$1.render = render;

  return exports$1;

}));