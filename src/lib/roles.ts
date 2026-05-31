/**
 * Checks if a user has the 'developer' role.
 * Works with both Clerk's User object and session claims.
 */
export function isDeveloper(user: { publicMetadata?: Record<string, unknown> | null } | null) {
  if (!user || !user.publicMetadata) return false;
  return user.publicMetadata.role === "developer";
}

/**
 * Checks if a user is the admin of a specific room.
 */
export function isRoomAdmin(userId: string | null | undefined, roomCreatorId: string | null | undefined) {
  if (!userId || !roomCreatorId) return false;
  return userId === roomCreatorId;
}
