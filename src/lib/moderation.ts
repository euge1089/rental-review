const FULL_NAME_PATTERN = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;

export function detectLikelyPersonNames(input: string): string[] {
  const matches = input.match(FULL_NAME_PATTERN) ?? [];
  return Array.from(new Set(matches));
}

export function requiresModerationQueue(input: string): boolean {
  return detectLikelyPersonNames(input).length > 0;
}
