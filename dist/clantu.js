/*!
 * Clantujs v1.0.0
 * (c) 2016 Clunt
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.C = factory());
}(this, function () { 'use strict';

  var toString = {}.toString;


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

  var isarray = Array.isArray || function (arr) {
    return toString.call(arr) == '[object Array]';
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

    if (!isarray(keys)) {
      options = /** @type {!Object} */ (keys)
      keys = []
    } else if (!options) {
      options = {}
    }

    if (path instanceof RegExp) {
      return regexpToRegexp(path, /** @type {!Array} */ (keys))
    }

    if (isarray(path)) {
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
      if (self.match(ctx, ctx.params)) return fn(ctx, next);
      next();
    };
  };

  Route.prototype.match = function(ctx, params) {
    var keys = this.keys;
    var pathname = ctx.pathname;
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
      } else if (isarray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }
    };
    return ret;
  }

  function Context(path, state) {
    this.state = state || {};
    this.path = path;
    this.params = {};

    var pathname = path;
    var hashIndex = pathname.indexOf('#');

    this.hash = ~hashIndex ? pathname.slice(hashIndex + 1) : '';
    pathname = ~hashIndex ? pathname.slice(0, hashIndex) : pathname;

    var searchIndex = pathname.indexOf('?');

    this.querystring = ~searchIndex ? pathname.slice(searchIndex + 1) : '';
    pathname = ~searchIndex ? pathname.slice(0, searchIndex) : pathname;

    this.query = querystring(this.querystring);
    this.pathname = pathname;
  }

  var PATH_CURRENT = '';
  var CALLBACKS = [];
  var EXITS = [];
  var PREV_CONTEXT;

  function match(path, state) {
    var ctx = new Context(path, state);
    PATH_CURRENT = ctx.path;
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
      if (ctx.path !== PATH_CURRENT) return;
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


  var router = {
    register: register,
    match: match
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

  var c = null;

  /**
   * C
   * @param {Object} option
   * {
   *   root
   *   history
   * }
   */
  function C(option) {
    option = option || {};
    if (!(this instanceof C)) {
      return new C(option);
    }

    var self = this;
    this.running = false;

    var root = 'undefined' === typeof option.root ? null : option.root;
    this.root = root;

    // check if HTML5 history is available
    var hasPushState = typeof window !== 'undefined' && window.history && window.history.pushState;
    this._history = option.history && hasPushState;
    this._historyFallback = option.history && !hasPushState;

    this.mode = this._history ? 'html5' : 'hash';
    var History = historyBackends[this.mode]

    this.history = new History({
      root: root,
      onChange: function(path, state) {
        router.match(path, state);
      }
    });

    this.link = new Link({
      onClick: function(path) {
        if (self._history && 0 === path.indexOf('#')) {
          location.hash = path;
        } else {
          self.go(path);
        }
      }
    });
  }

  C.prototype.router = router.register;

  C.prototype.start = function(option) {
    if (this.running) return;
    this.running = true;

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

    this.link.start();
    this.history.start();
  };

  C.prototype.stop = function() {
    this.history.stop();
    this.link.stop();
    this.running = false;;
  };

  C.prototype.show = function(path) {
    router.match(path);
  };

  C.prototype.go = function(path) {
    this.history.go(path);
  };

  C.prototype.replace = function(path) {
    this.history.go(path, true);
  };

  function index(option) {
    if (!c) {
      c = new C(option);
    }
    return c;
  }

  return index;

}));
