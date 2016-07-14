import C from '../../src'


export function configRouter() {
  var app = C();
  var router = app.router;

  app.template.helper('lang', function(data) {
    console.log(arguments)
    return data;
  });

  app.template.partial('name', '{{count}}');
  app.template.partial('content', '{{#lang}}');

  router('/query', function(ctx, next) {
    console.log('query', ctx)
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
    var render = app.template(template);
    var html = render(data);
    // var html = ctx.$render(template, data, options);
    console.log(render.toString())
    document.getElementById('content').innerHTML = html;
  });
}
