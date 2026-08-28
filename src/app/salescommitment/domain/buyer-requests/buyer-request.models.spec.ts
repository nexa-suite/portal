import { describe, expect, it } from 'vitest';
import { deliveryDateIssue, nextBusinessDateInputValue } from './buyer-request.models';

describe('buyer request delivery date rules', () => {
  it('requires a date at least three business days from today by default', () => {
    const minimum = nextBusinessDateInputValue(3);

    expect(minimum).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(deliveryDateIssue(minimum, minimum)).toBeNull();
  });

  it('rejects missing, early and weekend dates', () => {
    expect(deliveryDateIssue('', '2026-08-31')).toBe('required');
    expect(deliveryDateIssue('2026-08-30', '2026-08-31')).toBe('minimum');
    expect(deliveryDateIssue('2026-09-05', '2026-08-31')).toBe('weekday');
  });
});
