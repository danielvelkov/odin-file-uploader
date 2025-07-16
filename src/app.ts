import express from 'express';
import livereload from 'livereload';
import connectLivereload from 'connect-livereload';
import homeRouter from './routes/homeRouter';
import path from 'path';
import 'dotenv/config';

const app = express();

if (process.env.NODE_ENV === 'development') {
  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(['src/**/*']);
  liveReloadServer.server.once('connection', () => {
    setTimeout(() => {
      liveReloadServer.refresh('');
    }, 10);
  });
  app.use(connectLivereload());
}

app.use(express.static('src/public'));

app.set('view engine', 'ejs');
app.set('views', path.join('src', 'views'));

app.use('/', homeRouter);

export default app;
