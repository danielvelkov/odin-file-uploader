import { NextFunction, Request, Response } from 'express';
import HttpStatusError from '../util/errors/StatusError';

const globalHttpStatusErrorHandler = (
  err: HttpStatusError,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { statusCode, message } = err;
  if (statusCode === 404)
    res.status(404).render('error', {
      statusCode,
      title: 'Not Found',
      error: message || 'Requested resource was not found',
    });
  else if (statusCode === 401)
    res.status(401).render('error', {
      statusCode,
      title: 'Unauthorized',
      error: message || 'Unauthorized access',
    });
  else {
    console.error(err);
    res.status(500).render('error', {
      statusCode,
      title: 'Internal Server Error',
      error: message || 'Oops! Something went wrong',
    });
  }
  next();
};

export default globalHttpStatusErrorHandler;
