import { bindEvent, removeEvent } from '../lib/util'


export var hashChange = (function() {
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

export function resolvePath(base, relative) {
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
