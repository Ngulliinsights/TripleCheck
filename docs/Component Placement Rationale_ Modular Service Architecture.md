## Component Placement Rationale: Modular Service Architecture

Based on the analysis of the provided `project-structure.md` and the user's preference for Option A (Modular Service Architecture) due to its minimal disruption, the most ideal location for the refactored property image handling components is within the `shared/` directory, organized by their functional roles (services, hooks, types, utils, config).

### Rationale for Choosing Option A (Modular Service Architecture):

1.  **Alignment with Existing Structure:** The `project-structure.md` indicates a clear separation of concerns at the top level, with `api/`, `config/`, `database/`, `server/`, and implicitly, a `shared/` or `frontend/` layer where UI components, hooks, and client-side services would reside. Placing the new components under `shared/` (or a similar top-level client-side directory if one exists and is more appropriate, but `shared/` is a common pattern for reusable frontend code) aligns with this existing modularity.

2.  **Clear Separation of Concerns within Image Handling:** Option A explicitly separates services, hooks, types, and utilities into their respective directories. This mirrors the best practices of a well-structured frontend application and allows for easy discoverability and maintenance of each functional unit.
    - **`shared/services/images/`**: This is the logical home for `PropertyImageUploadCoordinator.ts`, `PropertyImageValidationService.ts`, and `PropertyImageWorkflowManager.ts`. These are core business logic units that interact with external APIs and manage complex processes. Placing them here clearly identifies them as reusable service layers.
    - **`shared/hooks/images/`**: `usePropertyImageUpload.ts` is a React hook. Placing it under `shared/hooks/` (with an `images/` subdirectory for domain specificity) is consistent with how custom hooks are typically organized in React projects.
    - **`shared/components/images/`**: The `PropertyImageVault.tsx` (the updated UI component) belongs here. This maintains the original `shared/components/images/` path for UI-related components, minimizing disruption to existing UI imports that might still be referencing this path for other image-related UI elements.
    - **`shared/types/images/`**: Centralized type definitions (`index.ts`) for the image domain. This is a common pattern for managing types in larger TypeScript projects.
    - **`shared/utils/images/`**: Utility functions (`constants.ts`, `formatters.ts`) that are specific to image handling but are generic enough to be used across different services or components. Placing them here keeps them organized and reusable.
    - **`shared/config/`**: The `image-service.config.ts` file, which contains environment-specific configurations for the image services, should reside in a `config/` directory at the `shared/` level, mirroring the top-level `config/` directory for backend configurations.

3.  **Minimal Disruption (as per user's choice):** By maintaining the `shared/components/images/` path for the primary UI component (`PropertyImageVault.tsx`) and organizing other functional units into existing or new `shared/` subdirectories (`services`, `hooks`, `types`, `utils`, `config`), the impact on existing codebase references is minimized. Developers will primarily need to update imports for the services and hooks, rather than a complete overhaul of paths.

4.  **Scalability and Maintainability:** This structure promotes a scalable and maintainable codebase. New image-related services, hooks, or utilities can be easily added without cluttering existing directories. The clear separation makes it easier for developers to find relevant code and understand its purpose.

5.  **Consistency with Project Patterns:** The project structure already demonstrates a preference for functional separation (e.g., `api/v1/document-auth/`, `server/document-auth/`). Extending this pattern to the frontend `shared/` layer for image handling services and components is a natural fit.

### Proposed Directory Structure:

```
shared/
├── config/                    # Configuration management for shared modules
│   └── image-service.config.ts
├── services/                  # Reusable client-side business logic services
│   └── images/                # Domain-specific services for image handling
│       ├── PropertyImageUploadCoordinator.ts
│       ├── PropertyImageValidationService.ts
│       └── PropertyImageWorkflowManager.ts
├── hooks/                     # Custom React hooks
│   └── images/                # Domain-specific hooks for image handling
│       └── usePropertyImageUpload.ts
├── components/                # Reusable UI components
│   └── images/                # Domain-specific UI components for image handling
│       └── PropertyImageVault.tsx
├── types/                     # Centralized TypeScript definitions
│   └── images/                # Domain-specific types for image handling
│       └── index.ts
└── utils/                     # General utility functions
    └── images/                # Domain-specific utilities for image handling
        ├── constants.ts
        └── formatters.ts
```

This structure provides a clear, logical, and maintainable organization for the refactored image handling components, aligning well with the existing project architecture and minimizing disruption during migration.
