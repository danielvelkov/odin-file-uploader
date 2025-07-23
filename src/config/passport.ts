import { User } from '../../generated/prisma';
import prisma from '../db/client';
import passport from 'passport';
import { Strategy as LocalStrategy, VerifyFunction } from 'passport-local';
import { validPassword } from '../util/passwordUtils';
import { NextFunction, Request, Response } from 'express';

const verify: VerifyFunction = async (email, password, done) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      return done(null, false, { message: 'Incorrect email or password' });
    }

    // check password here
    const isValid = await validPassword(password, user.password);

    if (!isValid) {
      return done(null, false, { message: 'Incorrect email or password' });
    }

    done(null, user);
  } catch (error) {
    console.error(error);
    done(error);
  }
};

const strategy = new LocalStrategy({ usernameField: 'email' }, verify);

passport.use(strategy);

passport.serializeUser((user, done) => {
  done(null, (user as User).id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: +(id as string),
      },
    });
    if (!user) return done({ message: 'No such user' }, false);
    done(null, user);
  } catch (error) {
    console.error(error);
    done(error);
  }
});

/**
 * Login Required middleware.
 */
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/account/login');
};
