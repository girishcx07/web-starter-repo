/** Opaque nominal typing for string IDs (prevents accidental cross-wiring). */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<string, "UserId">;
export type PostId = Brand<string, "PostId">;

export function toUserId(id: string): UserId {
  return id as UserId;
}

export function toPostId(id: string): PostId {
  return id as PostId;
}
