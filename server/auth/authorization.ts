/**
 * CASL Authorization System
 * Fine-grained permission management
 */

import { AbilityBuilder, Ability, AbilityClass } from '@casl/ability';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../infrastructure/observability/telemetry';

// Define action types
type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'verify' | 'approve';

// Define subject types
type Subjects =
  | 'Property'
  | 'User'
  | 'Review'
  | 'Document'
  | 'Message'
  | 'Notification'
  | 'Analytics'
  | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;
export const AppAbility = Ability as AbilityClass<AppAbility>;

/**
 * Define abilities for a user based on their role
 */
export function defineAbilitiesFor(user: any): AppAbility {
  const { can, cannot, build } = new AbilityBuilder(AppAbility);

  if (user.role === 'admin') {
    // Admin can do everything
    can('manage', 'all');
    
    logger.debug('Admin abilities defined', { userId: user.id });
  } else if (user.role === 'agent') {
    // Agents can manage properties
    can('read', 'Property');
    can('create', 'Property');
    can('update', 'Property', { ownerId: user.id });
    can('delete', 'Property', { ownerId: user.id });
    
    // Agents can verify documents
    can('verify', 'Document');
    can('read', 'Document');
    
    // Agents can read reviews
    can('read', 'Review');
    
    // Agents can manage their own profile
    can('read', 'User', { id: user.id });
    can('update', 'User', { id: user.id });
    
    // Agents can read messages
    can('read', 'Message');
    can('create', 'Message');
    
    // Agents can read analytics
    can('read', 'Analytics');
    
    logger.debug('Agent abilities defined', { userId: user.id });
  } else if (user.role === 'user') {
    // Regular users can read properties
    can('read', 'Property');
    
    // Users can create and manage their own reviews
    can('create', 'Review');
    can('read', 'Review');
    can('update', 'Review', { userId: user.id });
    can('delete', 'Review', { userId: user.id });
    
    // Users can manage their own profile
    can('read', 'User', { id: user.id });
    can('update', 'User', { id: user.id });
    
    // Users can read and create messages
    can('read', 'Message');
    can('create', 'Message');
    
    // Users can read their own notifications
    can('read', 'Notification', { userId: user.id });
    
    logger.debug('User abilities defined', { userId: user.id });
  } else {
    // Guest users (not authenticated)
    can('read', 'Property');
    
    logger.debug('Guest abilities defined');
  }

  return build();
}

/**
 * Middleware to require authentication
 */
export function requireAuth() {
  return passport.authenticate('jwt', { session: false });
}

/**
 * Middleware to check if user has specific ability
 */
export function requireAbility(action: Actions, subject: Subjects) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn('Authorization failed - no user', {
        action,
        subject,
        path: req.path,
      });
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const ability = defineAbilitiesFor(req.user);

    if (ability.can(action, subject)) {
      logger.debug('Authorization successful', {
        userId: req.user.id,
        action,
        subject,
      });
      next();
    } else {
      logger.warn('Authorization failed - insufficient permissions', {
        userId: req.user.id,
        action,
        subject,
        path: req.path,
      });
      res.status(403).json({
        error: 'Insufficient permissions',
        required: { action, subject },
      });
    }
  };
}

/**
 * Middleware to check if user can perform action on specific resource
 */
export function requireAbilityOn(
  action: Actions,
  subject: Subjects,
  getResource: (req: any) => any
) {
  return async (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    try {
      const resource = await getResource(req);
      const ability = defineAbilitiesFor(req.user);

      if (ability.can(action, subject, resource)) {
        logger.debug('Resource authorization successful', {
          userId: req.user.id,
          action,
          subject,
          resourceId: resource?.id,
        });
        next();
      } else {
        logger.warn('Resource authorization failed', {
          userId: req.user.id,
          action,
          subject,
          resourceId: resource?.id,
        });
        res.status(403).json({
          error: 'Insufficient permissions for this resource',
        });
      }
    } catch (error: any) {
      logger.error('Authorization error', {
        userId: req.user.id,
        error: error.message,
      });
      res.status(500).json({
        error: 'Authorization check failed',
      });
    }
  };
}

/**
 * Check if user has ability (for use in code, not middleware)
 */
export function can(user: any, action: Actions, subject: Subjects): boolean {
  const ability = defineAbilitiesFor(user);
  return ability.can(action, subject);
}

/**
 * Get all abilities for a user (for debugging/UI)
 */
export function getAbilities(user: any) {
  const ability = defineAbilitiesFor(user);
  return ability.rules;
}

import passport from './passport-config';

export default {
  defineAbilitiesFor,
  requireAuth,
  requireAbility,
  requireAbilityOn,
  can,
  getAbilities,
};
