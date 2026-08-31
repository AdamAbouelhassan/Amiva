/** Metro resolves static image requires to an asset module id at build
 * time; give TypeScript a type for them. */
declare module '*.png' {
  const value: number;
  export default value;
}
declare module '*.jpg' {
  const value: number;
  export default value;
}
