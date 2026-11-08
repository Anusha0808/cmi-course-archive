export function websiteUrl(input: string) {
  const text = input.trim();
  const url = new URL(text.includes('://') ? text : `https://${text}`);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.') || /\s/.test(text)) {
    throw new Error('Enter a valid HTTP or HTTPS website address.');
  }
  return url.href;
}

export function ringNeighbor<T>(members: readonly T[], index: number, direction: -1 | 1): T | undefined {
  if (!members.length) return undefined;
  return members[((index + direction) % members.length + members.length) % members.length];
}