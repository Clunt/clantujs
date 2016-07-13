import router from './router'
import HashHistory from './history/hash'
import HTML5History from './history/html5'
import Link from './link'

var historyBackends = {
  hash: HashHistory,
  html5: HTML5History
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
    var history = new HTML5History({ root: this.root });
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

export default function(option) {
  if (!c) {
    c = new C(option);
  }
  return c;
}
