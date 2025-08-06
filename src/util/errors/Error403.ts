import HttpStatusError from './StatusError';

export default class Error403 extends HttpStatusError {
  statusCode: number = 403;
  name: string = 'ForbiddenError';
  constructor(message: string) {
    super(message);
  }
}
