import { describe, it, expect } from 'vitest';

import {
  formatProjectNumber,
  formatEpicNumber,
  formatIssueNumber,
  formatEntityTitle,
} from './entity-numbers';

describe('Entity Number Formatting', () => {
  describe('formatProjectNumber', () => {
    it('should format project numbers with P- prefix', () => {
      expect(formatProjectNumber(1)).toBe('P-1');
      expect(formatProjectNumber(42)).toBe('P-42');
      expect(formatProjectNumber(999)).toBe('P-999');
    });
  });

  describe('formatEpicNumber', () => {
    it('should format epic numbers with E- prefix', () => {
      expect(formatEpicNumber(1)).toBe('E-1');
      expect(formatEpicNumber(123)).toBe('E-123');
    });
  });

  describe('formatIssueNumber', () => {
    it('should format issue numbers with I- prefix', () => {
      expect(formatIssueNumber(1)).toBe('I-1');
      expect(formatIssueNumber(5000)).toBe('I-5000');
    });
  });

  describe('formatEntityTitle', () => {
    it('should format project titles', () => {
      expect(formatEntityTitle('project', 1, 'My Project')).toBe('P-1: My Project');
    });

    it('should format epic titles', () => {
      expect(formatEntityTitle('epic', 42, 'Backend Work')).toBe('E-42: Backend Work');
    });

    it('should format issue titles', () => {
      expect(formatEntityTitle('issue', 123, 'Fix login bug')).toBe('I-123: Fix login bug');
    });
  });
});
