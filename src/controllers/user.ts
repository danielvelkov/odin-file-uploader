import prisma from '../db/client';
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { hashPassword } from '../util/passwordUtils';
import { Alert } from '../util/Alert';
import passport from 'passport';

const userValidationChain = [
  body('email')
    .notEmpty()
    .withMessage('Value is required')
    .isEmail()
    .withMessage('Please enter a valid email.'),
  body('password')
    .notEmpty()
    .withMessage('Value is required')
    .matches(/^[^\s]+$/)
    .withMessage('Field cannot contain spaces.')
    .bail()
    .isStrongPassword({
      minLength: 8,
      minUppercase: 0,
      minLowercase: 1,
      minSymbols: 0,
      minNumbers: 1,
    })
    .withMessage(
      'Field must contain a lowercase letter, a number and be at least 8 characters long',
    ),
  body('confirm-password')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Confirm password does not match entered password.'),
];

/**
 * Login page.
 * @route GET /account/login
 */
export const getLogin = (req: Request, res: Response) => {
  res.render('account/login', {
    title: 'Login',
    alerts: req.session.messages?.map((m) => new Alert('error', '', m)),
  });
  req.session.messages = [];
};

/**
 * Login using email and password.
 * @route POST /account/login
 */
export const postLogin =
  // see src/config/passport.ts for authentication strategy
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/account/login',
    failureMessage: true,
  });

/**
 * Signup page.
 * @route GET /account/signup
 */
export const getSignup = (req: Request, res: Response) => {
  res.render('account/signup', {
    title: 'signup',
  });
};

/**
 * Sign up using email and password.
 * @route POST /account/signup
 */
export const postSignup = [
  userValidationChain,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorAlert = new Alert(
        'error',
        '',
        errors
          .array()
          .map((e) => {
            if (e.type === 'field') return ` • ${e.path}: ${e.msg}`;
            else return ` • ${e.msg}`;
          })
          .join('\r\n'),
      );
      return res.render('account/signup', {
        alerts: [errorAlert],
      });
    } else {
      try {
        const hashedPassword = await hashPassword(req.body.password);

        const user = await prisma.user.create({
          data: {
            email: req.body.email,
            password: hashedPassword,
          },
        });

        await prisma.folder.createMany({
          data: [
            { name: 'Documents', owner_id: user.id, parentFolderId: null },
            { name: 'Images', owner_id: user.id, parentFolderId: null },
            { name: 'Downloads', owner_id: user.id, parentFolderId: null },
          ],
        });

        res.redirect('/');
      } catch (error) {
        console.log(error);
        next(error);
      }
    }
  },
];

/**
 * Log user out.
 * @route GET /account/logout
 */
export const getLogout = (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/account/login');
  });
};
