import C from '../../src'


export function configRouter() {
  var router = C().router;
  router('/query/*', function(ctx, next) {
    console.log('query', ctx)
    document.getElementById('content').innerHTML = 'query';
    setTimeout(function() {
      next();
    }, 1500);
  }, function(ctx) {
    document.getElementById('content').innerHTML = 'End';
  });
}
