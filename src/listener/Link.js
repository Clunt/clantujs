import { bindEvent, removeEvent, preventDefault } from '../lib/util'

function which(evt) {
  evt = evt || window.event;
  return null === evt.which ? evt.button : evt.which;
}

function sameOrigin(href) {
  var origin = location.protocol + '//' + location.hostname;
  if (location.port) origin += ':' + location.port;
  return (href && (0 === href.indexOf(origin)));
}

function Link(option) {
  this.onClick = option.onClick;
}

Link.prototype.start = function() {
  var self = this;
  this.listener = function(evt) {
    if (1 !== which(evt)) return;

    if (evt.metaKey || evt.ctrlKey || evt.shiftKey) return;
    if (evt.defaultPrevented) return;


    // ensure link
    var el = evt.target;
    while (el && 'A' !== el.nodeName) el = el.parentNode;
    if (!el || 'A' !== el.nodeName) return;



    // Ignore if tag has
    // 1. "download" attribute
    // 2. rel="external" attribute
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

    var link = el.getAttribute('href');

    // Check for mailto: in the href
    if (link && link.indexOf('mailto:') > -1) return;

    // check target
    if (el.target) return;

    // x-origin
    if (!sameOrigin(el.href)) return;


    // rebuild path
    var path = el.pathname + el.search + (el.hash || '');


    preventDefault(evt);
    self.onClick(link);
  };
  bindEvent(document, 'click', this.listener);
};

Link.prototype.stop = function() {
  removeEvent(document, 'click', this.listener);
};


export default Link;
