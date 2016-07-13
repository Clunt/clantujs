import { resolvePath, hashChange } from '../lib/util'

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

export default HashHistory
