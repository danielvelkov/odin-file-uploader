import express, { Request } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import livereload from 'livereload';
import connectLivereload from 'connect-livereload';
import homeRouter from './routes/homeRouter';
import userRouter from './routes/userRouter';
import driveRouter from './routes/driveRouter';
import path from 'path';
import 'dotenv/config';
import passport from 'passport';
import methodOverride from 'method-override';
import useragent from 'express-useragent';
import { Pool } from 'pg';
import { CipherKey } from 'crypto';
import globalHttpStatusErrorHandler from './middleware/globalHttpStatusErrorHandler';
import Error404 from './util/errors/Error404';

const { DATABASE_URL, SESSION_SECRET } = process.env;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const app = express();

app.use(useragent.express());
app.use(methodOverride('_method'));

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

const PgSession = connectPgSimple(session);

app.use(
  session({
    secret: SESSION_SECRET as CipherKey,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
    store: new PgSession({
      pool: pool,
    }),
  }),
);

app.use(express.urlencoded({ extended: true }));

// Import passport config
import './config/passport';
app.use(passport.session());

app.use((req: Request, res, next) => {
  // console.log((req.session);
  // console.log(req.user);
  next();
});

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use('/drive', driveRouter);
app.use('/account', userRouter);
app.use('/', homeRouter);

// All unmapped routes handled here
app.use((req, res, next) => {
  next(new Error404('Page not found'));
});

app.use(globalHttpStatusErrorHandler);

export default app;
