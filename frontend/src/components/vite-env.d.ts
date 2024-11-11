/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI: string;
    // Add other environment variables here
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  