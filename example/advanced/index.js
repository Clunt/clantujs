import Clantu from '../../src'
import { configRouter } from './route-config'

var app = Clantu({
  listener: {
    history: true,
    root: '/v1'
  }
});

configRouter();

app.start();


window.app = app;
