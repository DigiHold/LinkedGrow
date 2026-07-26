export const dayAgoIso = (): string => new Date(Date.now() - 86_400_000).toISOString();
export const weekAgoIso = (): string => new Date(Date.now() - 7 * 86_400_000).toISOString();
export const epochIso = (): string => new Date(0).toISOString();
