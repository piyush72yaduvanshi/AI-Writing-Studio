import { describe, it, expect } from 'vitest';
import { calculateCounts, truncateSnippet } from './text';

describe('Text Utilities', () => {
  it('correctly calculates word and character counts', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const counts = calculateCounts(text);
    expect(counts.words).toBe(9);
    expect(counts.chars).toBe(43);
  });

  it('handles empty string counts', () => {
    const counts = calculateCounts('   ');
    expect(counts.words).toBe(0);
    expect(counts.chars).toBe(3);
  });

  it('truncates snippet properly', () => {
    const longText = 'This is a long sentence that exceeds the small limit provided in the test case.';
    const truncated = truncateSnippet(longText, 20);
    expect(truncated.endsWith('...')).toBe(true);
    expect(truncated.length).toBe(23);
  });
});
