import path2regexp from '../lib/path2regexp'


function Route(path) {
  this.path = '*' === path ? '(.*)' : path;
  this.keys = [];
  this.regexp = path2regexp(this.path, this.keys);
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

export default Route
