// vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_EXPRESS_URL: string;
    // Add other environment variables if needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  interface ImportMetaEnv {
    readonly VITE_SITE_KEY: string;
    readonly VITE_EXPRESS_URL: string;
    // Add other environment variables as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
    