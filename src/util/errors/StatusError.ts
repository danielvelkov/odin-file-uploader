export default abstract class HttpStatusError extends Error {
  statusCode: number = 500;
  name: string = 'ServerError';
}
