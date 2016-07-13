import querystring from '../lib/querystring'


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

export default Context
