import compile from './lib/compile'
import store from './lib/store'
import { getCache } from './lib/get'

import render from './method/render'
import helper from './method/helper'
import partial from './method/partial'


function template(source, options) {
  if (typeof options === 'string') {
    options = {
      filename: options
    };
  }
  options = options || {};
  if (options.cache === false) {
    store[options.filename] = undefined;
  }
  return getCache(options.filename) || compile(source, options);
}

template.render = render;

template.helper = helper;

template.partial = partial;


export default template

export { render }
