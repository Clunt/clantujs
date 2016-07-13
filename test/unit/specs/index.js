var UA = navigator.userAgent.toLowerCase()
window.isIE9 = UA.indexOf('msie 9.0') > 0
window.isIE = UA.indexOf('trident') > 0

// IE has some shaky timer precision issues when using the Promise polyfill...
window.wait = isIE ? 100 : 30


var C = require('../../../src')
