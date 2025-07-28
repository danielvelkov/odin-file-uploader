import 'express-session';
import { Alert } from '../util/Alert';

declare module 'express-session' {
  interface SessionData {
    /**
     * Set by passport.js authenticate(). Contains all auth error for the current session.
     */
    messages?: string[];
    alerts: Alert[];
  }
}
