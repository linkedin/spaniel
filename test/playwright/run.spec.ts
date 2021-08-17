import { test } from '@playwright/test';
import { visibleTimeModule } from './modules/visible-time-tests';
import { spanielObserverModule } from './modules/spaniel-observer-tests';
import * as http from 'http';

import express from 'express';
import serveStatic from 'serve-static';

function serveTestApp(): Promise<http.Server> {
  const app = express();

  app.use('/', serveStatic(__dirname + '/../app'));
  app.use('/exports', serveStatic(__dirname + '/../../exports'));
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject('Test server start timeout');
    }, 5000);
    const handle = app.listen(3000, function() {
      resolve(handle);
      clearTimeout(timeout);
    });
  });
}

function runModules() {
  visibleTimeModule();
  spanielObserverModule();
}

let handle: http.Server;
test.beforeAll(async () => {
  handle = await serveTestApp();
});
test.afterAll(async () => {
  handle.close();
});

runModules();
