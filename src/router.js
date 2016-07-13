import Route from './model/Route'
import Context from './model/Context'

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


export default {
  register: register,
  match: match
}

export { register, match }
