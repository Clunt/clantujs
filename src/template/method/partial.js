import config from '../lib/config'


/**
 * 添加模板片段
 * @name   template.helper
 * @param  {String} name    名称
 * @param  {String} partial 模版片段
 */
export default function partial(name, partial) {
  config.$partials[name] = partial;
}
