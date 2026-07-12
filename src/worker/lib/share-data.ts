export interface ShareData {
  spec: string;
  config: object;
  sessionToken?: string;
}

export type PublicShareData = Omit<ShareData, "sessionToken">;

export function safeParseShare(raw: string | null): ShareData | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as ShareData;
  } catch {
    return null;
  }
}

export function toPublic(data: ShareData): PublicShareData {
  const { sessionToken: _, ...pub } = data;
  return pub;
}

export function ttlSeconds(days: number): number {
  return days * 24 * 60 * 60;
}
