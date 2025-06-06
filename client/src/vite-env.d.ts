/// <reference types="vite/client" />

// Path aliases
declare module "@/*" {
  const content: any;
  export default content;
}

interface ImportMeta {
  env: {
    [key: string]: unknown;
  };
}
