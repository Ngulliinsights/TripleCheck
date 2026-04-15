/**
 * Authentication & Authorization Exports
 */

export { default as passport } from './passport-config';

export {
  defineAbilitiesFor,
  requireAuth,
  requireAbility,
  requireAbilityOn,
  can,
  getAbilities,
} from './authorization';

export type { AppAbility } from './authorization';
