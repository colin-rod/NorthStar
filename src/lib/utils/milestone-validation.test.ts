/**
 * Unit Tests: Milestone Validation Utilities
 *
 * Tests milestone name and due_date validation functions
 * following TDD Red-Green-Refactor cycle.
 */

import { describe, it, expect } from 'vitest';

import { validateMilestoneName } from './milestone-validation';

describe('validateMilestoneName', () => {
  it('should accept valid milestone names', () => {
    expect(validateMilestoneName('Q1 2026 Launch')).toBe(true);
    expect(validateMilestoneName('Sprint 23')).toBe(true);
    expect(validateMilestoneName('v1.0 Release')).toBe(true);
    expect(validateMilestoneName('a')).toBe(true); // Single character is valid
  });

  it('should reject empty string', () => {
    expect(validateMilestoneName('')).toBe(false);
  });

  it('should reject whitespace-only string', () => {
    expect(validateMilestoneName('   ')).toBe(false);
    expect(validateMilestoneName('\t\n')).toBe(false);
  });

  it('should reject names over 100 characters', () => {
    const longName = 'x'.repeat(101);
    expect(validateMilestoneName(longName)).toBe(false);
  });

  it('should accept names exactly 100 characters', () => {
    const exactName = 'x'.repeat(100);
    expect(validateMilestoneName(exactName)).toBe(true);
  });

  it('should handle null and undefined as invalid', () => {
    expect(validateMilestoneName(null as any)).toBe(false);
    expect(validateMilestoneName(undefined as any)).toBe(false);
  });
});
