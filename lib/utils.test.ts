import { cn } from './utils';

describe('cn utility function in weather dashboard', () => {
  test('should merge class names correctly', () => {
    const result = cn('text-blue-600', 'bg-slate-100');
    expect(result).toContain('text-blue-600');
    expect(result).toContain('bg-slate-100');
  });

  test('should override Tailwind classes correctly when there is a conflict', () => {
    const result = cn('w-full', 'w-1/2');
    expect(result).toBe('w-1/2');
  });

  test('should filter out falsy values', () => {
    const result = cn('grid', false, null, undefined, 'gap-4');
    expect(result).toBe('grid gap-4');
  });
});
