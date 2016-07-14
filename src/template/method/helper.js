import config from '../lib/config'


/**
 * 添加模板辅助方法
 * @name   template.helper
 * @param  {String}   name   名称
 * @param  {Function} helper 方法
 */
export default function helper(name, helper) {
  config.$helpers[name] = helper;
}
