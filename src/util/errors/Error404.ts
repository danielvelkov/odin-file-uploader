import HttpStatusError from './StatusError';

export default class Error404 extends HttpStatusError {
  statusCode: number = 404;
  name: string = 'NotFoundError';
  constructor(message: string) {
    super(message);
  }
}
