declare module '*.module.css' {
  interface CSSModuleExports {
    [key: string]: string;
  }
  const exports: CSSModuleExports;
  export = exports;
}
