import { describe, expect, it } from 'vitest';
import { ringNeighbor, websiteUrl } from '@/lib/webring';

describe('CMI webring', () => {
  it('wraps previous and next links around the member ring', () => {
    expect(ringNeighbor(['a', 'b', 'c'], 0, -1)).toBe('c');
    expect(ringNeighbor(['a', 'b', 'c'], 2, 1)).toBe('a');
    expect(ringNeighbor([], 0, 1)).toBeUndefined();
  });
  it('accepts personal website addresses and blocks unsafe protocols and credentials', () => {
    expect(websiteUrl('example.org')).toBe('https://example.org/');
    expect(websiteUrl('https://example.org/blog')).toBe('https://example.org/blog');
    expect(() => websiteUrl('javascript://alert.test')).toThrow();
    expect(() => websiteUrl('https://user:password@example.org')).toThrow();
  });
});