import { ngExpressEngine } from '@nguniversal/express-engine';
import { APP_BASE_HREF } from '@angular/common';
import { existsSync } from 'fs';
import express from 'express';
import { AppServerModule } from './src/main.server';

// The Express server
const app = express();
const PORT = process.env['PORT'] || 4000;
const DIST_FOLDER = join(process.cwd(), 'dist');

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { AppServerModule, LAZY_MODULE_MAP, ngExpressEngine, provideModuleMap } = require('./dist/apps/website-server/main');

// Our Universal express-engine (found @ https://github.com/angular/universal/tree/main/modules/express-engine)
app.engine('html', ngExpressEngine({
  bootstrap: AppServerModule,
  providers: [
    provideModuleMap(LAZY_MODULE_MAP)
  ],
}));

app.set('view engine', 'html');
app.set('views', join(DIST_FOLDER, 'apps/website'));

// Example Express Rest API endpoints
// app.get('/api/**', (req, res) => { });
// Serve static files from /browser
app.get('*.*', express.static(join(DIST_FOLDER, 'apps/website'), {
  maxAge: '1y'
}));

// All regular routes use the Universal engine
app.get('*', (req, res) => {
  res.render('index', { req }, (err: Error, html: string) => {
    if (err) {
      console.error('SSR Error:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.send(html);
  });
});

// Start up the Node server
app.listen(PORT, () => {
  console.log(`Node Express server listening on http://localhost:${PORT}`);
});

function join(...args: string[]): string {
  return require('path').join(...args);
}