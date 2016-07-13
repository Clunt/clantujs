import C from '../../src'
import { configRouter } from './route-config'

var app = C({
  history: true,
  root: '/v1'
});

configRouter();

app.start();
