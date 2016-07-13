import { isarray } from './util'

export default function(querystring) {
  var ret = {};
  var query_arr = querystring.split('&');
  for (var i = 0; i < query_arr.length; i++) {
    var param = query_arr[i];
    if (param.length === 0) {
      continue;
    }
    var parts = param.split('=');

    var key = parts.shift();
    var val = parts.length > 0 ? parts.join('=') : undefined;
    val = val === undefined ? null : val;

    if (ret[key] === undefined) {
      ret[key] = val;
    } else if (isarray(ret[key])) {
      ret[key].push(val);
    } else {
      ret[key] = [ret[key], val];
    }
  };
  return ret;
}
