import HttpStatusError from './StatusError';

export default class Error410 extends HttpStatusError {
  statusCode: number = 410;
  name: string = 'GoneError';
  constructor(message: string) {
    super(message);
  }
}
