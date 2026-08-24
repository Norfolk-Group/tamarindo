/** Session key on the Nico DO: profileId + conversationId (KTD1). */
export function sessionKey(profileId: string, conversationId: string): string {
  return `${profileId}:${conversationId}`;
}
