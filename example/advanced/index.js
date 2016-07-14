import C from '../../src'
import { configRouter } from './route-config'

var app = C({
  listener: {
    history: false,
    root: '/v1'
  }
});

configRouter();

app.start();


window.app = app;
