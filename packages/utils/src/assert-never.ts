/**
 * Use in `default` branches so TypeScript errors if a discriminated union is not exhaustive.
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unexpected value: ${String(value)}`);
}
