var toString = {}.toString;

function bindEvent(elem, eventName, eventHandle) {
  if (elem && elem.addEventListener) {
    elem.addEventListener(eventName, eventHandle, false);
  } else if (elem && elem.attachEvent) {
    elem.attachEvent('on' + eventName, eventHandle);
  }
}

var removeEvent = document.removeEventListener ? function(elem, eventName, eventHandle) {
  if (elem.removeEventListener) {
    elem.removeEventListener(eventName, eventHandle, false);
  }
} : function(elem, eventName, eventHandle) {
  var name = 'on' + type;
  if (elem.detachEvent) {
    if ('undefined' === typeof elem[name]) {
      elem[name] = null;
    }
    elem.detachEvent(name, eventHandle);
  }
};

function preventDefault(evt) {
  // If preventDefault exists, run it on the original event
  if ( evt.preventDefault ) {
    evt.preventDefault();
  // Support: IE
  // Otherwise set the returnValue property of the original event to false
  } else {
    evt.returnValue = false;
  }
}

var isArray = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

function extend(obj) {
  obj = typeof obj === 'object' ? obj : {};

  var args = arguments;
  if (args.length > 1) {
    for (var i = 1; i < args.length; i++) {
      var arg = args[i];
      if (typeof arg === 'object' && !isArray(arg)) {
        for (var key in arg) {
          if (arg.hasOwnProperty(key)) {
            var value = arg[key];
            obj[key] = typeof value === 'object' ? extend(obj[key], value) : value;
          }
        }
      }
    }
  }
  return obj;
}

export default {}

export {
  bindEvent,
  removeEvent,
  preventDefault,
  isArray,
  extend
}
