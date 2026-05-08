/// <reference types="vite/client" />

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "@fontsource-variable/inter" {
  const value: unknown;
  export default value;
}

declare module "@fontsource-variable/fraunces" {
  const value: unknown;
  export default value;
}

declare module "@fontsource-variable/jetbrains-mono" {
  const value: unknown;
  export default value;
}
