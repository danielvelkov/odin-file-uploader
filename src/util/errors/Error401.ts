import HttpStatusError from './StatusError';

export default class Error401 extends HttpStatusError {
  statusCode: number = 401;
  name: string = 'UnauthorizedError';
  constructor(message: string) {
    super(message);
  }
}
