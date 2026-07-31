import { describe, expect, it } from 'vitest';
import { RegisterSchema } from './register';

const valid = { name: 'Ada', email: 'ada@example.com', password: 'longenough' };

describe('RegisterSchema', () => {
  it('accepts a valid registration', () => {
    expect(RegisterSchema.safeParse(valid).success).toBe(true);
  });

  it('trims and requires name', () => {
    expect(RegisterSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(RegisterSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false);
  });

  it('enforces password bounds (8–72, bcrypt limit)', () => {
    expect(RegisterSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false);
    expect(RegisterSchema.safeParse({ ...valid, password: 'x'.repeat(73) }).success).toBe(false);
    expect(RegisterSchema.safeParse({ ...valid, password: 'x'.repeat(72) }).success).toBe(true);
  });
});
