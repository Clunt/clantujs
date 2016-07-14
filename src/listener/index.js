import HashHistory from './history/Hash'
import HTML5History from './history/Html5'
import Link from './Link'

var historyBackends = {
  hash: HashHistory,
  html5: HTML5History
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

  this.history.start();
  this.link.start();
};

Listener.prototype.stop = function() {
  this.history.stop();
  this.link.stop();
  this.running = false;;
};


export default Listener
