/**
 * Passport.js Authentication Configuration
 * Replaces custom AuthenticationService
 */

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcrypt';
import { storage } from '../infrastructure/storage/storage';
import { logger } from '../infrastructure/observability/telemetry';

// Local strategy for username/password authentication
passport.use(
  'local',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        logger.debug('Local authentication attempt', { email });

        const user = await storage.getUserByUsername(email);

        if (!user) {
          logger.warn('Authentication failed - user not found', { email });
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.isActive) {
          logger.warn('Authentication failed - account inactive', {
            email,
            userId: user.id,
          });
          return done(null, false, { message: 'Account is inactive' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          logger.warn('Authentication failed - invalid password', {
            email,
            userId: user.id,
          });
          return done(null, false, { message: 'Invalid email or password' });
        }

        logger.info('Authentication successful', {
          userId: user.id,
          email: user.email,
        });

        return done(null, user);
      } catch (error: any) {
        logger.error('Authentication error', {
          email,
          error: error.message,
        });
        return done(error);
      }
    }
  )
);

// JWT strategy for API authentication
passport.use(
  'jwt',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
      issuer: 'triplecheck-api',
      audience: 'triplecheck-app',
      passReqToCallback: true,
    },
    async (req, payload, done) => {
      try {
        const userId = parseInt(payload.sub);
        const user = await storage.getUser(userId);

        if (!user || !user.isActive) {
          logger.warn('JWT authentication failed - user not found or inactive', {
            userId,
          });
          return done(null, false);
        }

        logger.debug('JWT authentication successful', { userId: user.id });
        return done(null, user);
      } catch (error: any) {
        logger.error('JWT authentication error', { error: error.message });
        return done(error, false);
      }
    }
  )
);

// Serialization for session-based authentication
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
