# Import Guide - Barrel Exports

This guide shows how to use the new barrel export system for cleaner, more organized imports.

## 🎯 Benefits

- **Cleaner imports**: Single import statements for multiple components
- **Better organization**: Logical grouping of related exports
- **Easier refactoring**: Centralized export management
- **Improved developer experience**: Autocomplete and IntelliSense support
- **Reduced bundle size**: Tree-shaking friendly exports

## 📦 Available Barrel Exports

### Property Module
```typescript
// Components
import { 
  PropertyMap, 
  PropertyMapEmbedded, 
  PropertyMapPage,
  CompareBar,
  CompareModal,
  EnhancedLandCard,
  PropertyReviews 
} from '@property/components';

// Hooks
import { 
  usePropertySearch,
  usePropertyFilters,
  usePropertyComparison 
} from '@property/hooks';

// Services
import { 
  PropertyService,
  PropertyAPI,
  PropertyValidator 
} from '@property/services';

// Pages
import { 
  PropertyDetails,
  PropertyListing,
  PropertySearch 
} from '@property/pages';
```

### Shared Module
```typescript
// UI Components
import { 
  Button,
  Card,
  Dialog,
  Input,
  LoadingSpinner,
  Badge,
  Avatar,
  Tabs,
  Toast 
} from '@shared/components/ui';

// Layout Components
import { 
  Header,
  Footer,
  Sidebar,
  Layout,
  Container 
} from '@shared/components/layout';

// Navigation Components
import { 
  MobileNav,
  DesktopNav,
  Breadcrumbs,
  NavigationMenu 
} from '@shared/components/navigation';

// Hooks
import { 
  useAuth,
  useToast,
  useLocalStorage,
  useDebounce,
  useIntersectionObserver 
} from '@shared/hooks';

// Utils
import { 
  formatCurrency,
  formatDate,
  validateEmail,
  debounce,
  throttle 
} from '@shared/utils';

// Services
import { 
  ApiClient,
  AuthService,
  StorageService 
} from '@shared/services';
```

### User Module
```typescript
// Components
import { 
  UserProfile,
  UserAvatar 
} from '@user/components';

// Pages
import { 
  UserProfileManagement,
  UserSettings,
  UserDashboard 
} from '@user/pages';

// Hooks
import { 
  useUserProfile 
} from '@user/hooks';
```

### Search Module
```typescript
// Components
import { 
  SearchBar,
  SearchFilters,
  SearchResults 
} from '@search/components';

// Hooks
import { 
  useSearch 
} from '@search/hooks';
```

### Auth Module
```typescript
// Components
import { 
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  AuthGuard 
} from '@auth/components';

// Hooks
import { 
  useAuth 
} from '@auth/hooks';
```

## 🔄 Migration Examples

### Before (Old Import Style)
```typescript
// Multiple import statements
import { PropertyCard } from '../property/components/PropertyCard';
import { PropertyList } from '../property/components/PropertyList';
import { PropertyMap } from '../property/components/PropertyMap';
import { usePropertySearch } from '../property/hooks/usePropertySearch';
import { usePropertyFilters } from '../property/hooks/usePropertyFilters';
import { Button } from '../shared/components/ui/button';
import { Card } from '../shared/components/ui/card';
import { Input } from '../shared/components/ui/input';
import { useAuth } from '../shared/hooks/useAuth';
import { useToast } from '../shared/hooks/use-toast';
```

### After (New Barrel Export Style)
```typescript
// Clean, organized imports
import { 
  PropertyCard, 
  PropertyList, 
  PropertyMap 
} from '@property/components';

import { 
  usePropertySearch, 
  usePropertyFilters 
} from '@property/hooks';

import { 
  Button, 
  Card, 
  Input 
} from '@shared/components/ui';

import { 
  useAuth, 
  useToast 
} from '@shared/hooks';
```

## 🎨 Best Practices

### 1. Group Related Imports
```typescript
// ✅ Good - Group by module
import { PropertyCard, PropertyList } from '@property/components';
import { Button, Card } from '@shared/components/ui';

// ❌ Avoid - Mixed grouping
import { PropertyCard } from '@property/components';
import { Button } from '@shared/components/ui';
import { PropertyList } from '@property/components';
```

### 2. Use Specific Imports
```typescript
// ✅ Good - Import only what you need
import { Button, Card, Input } from '@shared/components/ui';

// ❌ Avoid - Importing everything (affects tree-shaking)
import * as UI from '@shared/components/ui';
```

### 3. Consistent Path Usage
```typescript
// ✅ Good - Use path mappings consistently
import { PropertyCard } from '@property/components';
import { useAuth } from '@shared/hooks';

// ❌ Avoid - Mixing path styles
import { PropertyCard } from '@property/components';
import { useAuth } from '../shared/hooks/useAuth';
```

### 4. Organize Import Order
```typescript
// ✅ Good - Logical order
// 1. External libraries
import React from 'react';
import { Router } from 'react-router-dom';

// 2. Internal modules (alphabetical)
import { LoginForm } from '@auth/components';
import { PropertyCard } from '@property/components';
import { Button } from '@shared/components/ui';
import { useAuth } from '@shared/hooks';
```

## 🔧 IDE Configuration

### VS Code Settings
Add to your `.vscode/settings.json`:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "typescript.suggest.paths": true
}
```

### Auto Import Configuration
The barrel exports work seamlessly with:
- **VS Code**: Auto-import suggestions
- **WebStorm**: Smart import completion
- **Vim/Neovim**: With TypeScript LSP
- **Emacs**: With tide-mode or lsp-mode

## 📊 Performance Impact

### Bundle Size
- **Tree-shaking friendly**: Only imported components are bundled
- **Reduced duplication**: Centralized export management
- **Better compression**: Consistent import patterns

### Development Experience
- **Faster autocomplete**: Centralized exports improve IntelliSense
- **Easier refactoring**: Single point of truth for exports
- **Better code organization**: Logical grouping of related functionality

## 🚀 Advanced Usage

### Re-exporting with Aliases
```typescript
// In barrel export file
export { 
  PropertyMap as Map,
  PropertyCard as Card,
  PropertyList as List 
} from './components';

// Usage
import { Map, Card, List } from '@property/components';
```

### Conditional Exports
```typescript
// In barrel export file
export { default as DesktopNav } from './DesktopNav';
export { default as MobileNav } from './MobileNav';

// Usage with dynamic imports
const Nav = isMobile 
  ? (await import('@shared/components/navigation')).MobileNav
  : (await import('@shared/components/navigation')).DesktopNav;
```

### Type-only Imports
```typescript
// Import types separately for better tree-shaking
import type { Property, PropertyFilters } from '@property/types';
import { PropertyCard, PropertyList } from '@property/components';
```

## 🔍 Troubleshooting

### Common Issues

1. **Import not found**
   - Check if the component is exported in the barrel file
   - Verify the path mapping in `tsconfig.json`
   - Restart TypeScript service in your IDE

2. **Circular dependencies**
   - Avoid importing from barrel exports within the same module
   - Use relative imports for internal module dependencies

3. **Tree-shaking not working**
   - Ensure you're using named imports, not namespace imports
   - Check your bundler configuration for tree-shaking support

### Debug Commands
```bash
# Check TypeScript path resolution
npx tsc --showConfig

# Verify imports are working
npx tsc --noEmit

# Check bundle analysis (if using webpack)
npm run build -- --analyze
```

## 📝 Summary

The barrel export system provides:
- ✅ **17 barrel exports** created across major directories
- ✅ **187+ components and utilities** organized
- ✅ **Cleaner import statements** with path mappings
- ✅ **Better developer experience** with autocomplete
- ✅ **Tree-shaking friendly** exports for optimal bundles

Start using the new import system today for a better development experience!