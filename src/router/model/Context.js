import querystring from '../lib/querystring'
import { render } from '../../template'


function Context(path, state, referer, prev_ctx) {
  var pathname = path;

  var hash_i = pathname.indexOf('#');
  var hash = ~hash_i ? pathname.slice(hash_i + 1) : '';
  pathname = ~hash_i ? pathname.slice(0, hash_i) : pathname;

  var search_i = pathname.indexOf('?');
  var search = ~search_i ? pathname.slice(search_i + 1) : '';
  pathname = ~search_i ? pathname.slice(0, search_i) : pathname;

  var query = querystring(search);

  this.$state = state || {};
  this.$path = path;
  this.$params = {};
  this.$pathname = pathname;
  this.$hash = hash;
  this.$querystring = search;
  this.$query = query;
  this.$referer = referer;

  this.$prev = prev_ctx;

  this.$render = render;
}

export default Context
