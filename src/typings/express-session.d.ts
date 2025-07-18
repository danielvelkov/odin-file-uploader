import 'express-session';

declare module 'express-session' {
  interface SessionData {
    /**
     * Set by passport.js authenticate(). Contains all auth error for the current session.
     */
    messages?: string[];
  }
}
