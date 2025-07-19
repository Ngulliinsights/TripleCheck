/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CMS_PROVIDER: string;
  readonly VITE_CMS_API_URL: string;
  readonly VITE_CMS_API_KEY: string;
  readonly VITE_CMS_SPACE_ID: string;
  readonly VITE_CMS_PROJECT_ID: string;
  readonly VITE_CMS_DATASET: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}