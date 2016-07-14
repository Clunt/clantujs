import config from '../../config'

function onerror(e) {
  var message = 'Template Error\n\n';
  for (var name in e) {
    message += '<' + name + '>\n' + e[name] + '\n\n';
  }
  if (config.debug && typeof console === 'object') {
    console.error(message);
  }
}

// 模板调试器
var showDebugInfo = function(e) {
  onerror(e);
  return function() {
    return '{Template Error}';
  };
};


export { showDebugInfo }
