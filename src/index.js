import config from './config'
import { extend } from './lib/util'
import { register, match } from './router'
import template, { render } from './template'
import Listener from './listener'

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


export default function(option) {
  return app || ( app = new Clantu(option) );
}

export { router, template, render }
