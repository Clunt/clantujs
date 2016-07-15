import Clantu from '../../src'


export function configRouter() {
  var app = Clantu();
  var router = app.router;

  app.template.helper('lang', function(data) {
    return data;
  });

  app.template.partial('name', '{{count}}');
  app.template.partial('content', '{{#lang}}');

  router('/query', function(ctx, next) {
    // console.log('query', ctx)
    document.getElementById('content').innerHTML = 'query';
    setTimeout(function() {
      next();
    }, 0);
  }, function(ctx) {
    var template = ''
    template += '<h1>标题名称：{{lang | lang : this, lang}}{{include "name" obj}}{{include "content"}}</h1>';
    var data = {
      lang: '<p>Clunt</p>',
      obj: {
        count: 0
      }
    };
    var options = {};
    var render = app.template(template, 'filename');
    var html = render(data);
    document.getElementById('content').innerHTML = html;
  });
}
