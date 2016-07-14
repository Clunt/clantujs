import config from './lib/config'
import compile from './lib/compile'

import render from './method/render'
import helper from './method/helper'
import partial from './method/partial'


function template(source, options) {
  return compile(source, options);
}

template.render = render;
template.helper = helper;
template.partial = partial;


export default template

export { render }
