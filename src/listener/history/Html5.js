import { bindEvent, removeEvent } from '../../lib/util'
import { resolvePath, hashChange } from '../utils'


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


export default Html5History
