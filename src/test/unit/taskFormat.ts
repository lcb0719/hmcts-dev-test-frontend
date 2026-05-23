import {
  formatDueDateTime,
  formatStatus,
  statusTagClass,
  toApiDateTime,
  toDatetimeLocalValue,
} from '../../main/utils/taskFormat';
import { TaskStatus } from '../../main/types/task';

describe('taskFormat', () => {
  describe('formatStatus', () => {
    test('formats known statuses', () => {
      expect(formatStatus('PENDING')).toBe('Pending');
      expect(formatStatus('IN_PROGRESS')).toBe('In progress');
      expect(formatStatus('COMPLETED')).toBe('Completed');
    });

    test('returns unknown status as-is', () => {
      expect(formatStatus('UNKNOWN' as TaskStatus)).toBe('UNKNOWN');
    });
  });

  describe('statusTagClass', () => {
    test('returns tag classes for known statuses', () => {
      expect(statusTagClass('PENDING')).toBe('govuk-tag--grey');
      expect(statusTagClass('IN_PROGRESS')).toBe('govuk-tag--blue');
      expect(statusTagClass('COMPLETED')).toBe('govuk-tag--green');
    });

    test('returns empty string for unknown status', () => {
      expect(statusTagClass('UNKNOWN' as TaskStatus)).toBe('');
    });
  });

  describe('formatDueDateTime', () => {
    test('formats valid ISO datetime', () => {
      expect(formatDueDateTime('2026-06-01T09:00:00')).toMatch(/1 Jun 2026/);
    });

    test('returns original value for invalid date', () => {
      expect(formatDueDateTime('not-a-date')).toBe('not-a-date');
    });
  });

  describe('toApiDateTime', () => {
    test('returns empty value unchanged', () => {
      expect(toApiDateTime('')).toBe('');
    });

    test('appends seconds to datetime-local value', () => {
      expect(toApiDateTime('2026-06-01T09:00')).toBe('2026-06-01T09:00:00');
    });

    test('returns value unchanged when already includes seconds', () => {
      expect(toApiDateTime('2026-06-01T09:00:00')).toBe('2026-06-01T09:00:00');
    });
  });

  describe('toDatetimeLocalValue', () => {
    test('truncates ISO datetime to datetime-local length', () => {
      expect(toDatetimeLocalValue('2026-06-01T09:00:00')).toBe('2026-06-01T09:00');
    });

    test('returns empty string for missing value', () => {
      expect(toDatetimeLocalValue(undefined as unknown as string)).toBe('');
    });
  });
});
