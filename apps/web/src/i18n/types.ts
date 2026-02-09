/**
 * Type utilities for type-safe i18n paths
 */

// Extract all possible paths from a nested object type
export type PathImpl<T, Key extends keyof T> = Key extends string
  ? T[Key] extends Record<string, any>
    ?
        | `${Key}.${PathImpl<T[Key], Exclude<keyof T[Key], keyof any[]>> & string}`
        | `${Key}`
    : `${Key}`
  : never;

export type Path<T> = PathImpl<T, keyof T> | keyof T;

// Get the value type at a specific path
export type PathValue<
  T,
  P extends Path<T>,
> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

// Translation function type that accepts both string paths and Proxy paths
export type TranslateFn<T> = {
  (path: Path<T> | (() => string), options?: Record<string, any>): string;
  (path: string, options?: Record<string, any>): string;
};
