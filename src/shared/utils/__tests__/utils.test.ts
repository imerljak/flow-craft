import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import {
  generateId,
  debounce,
  throttle,
  formatDate,
  isValidUrl,
  isValidRegex,
  deepClone,
  isEqual,
} from '../index';

describe('Utility Functions', () => {
  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate ID with timestamp and random string', () => {
      const id = generateId();

      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('debounce', () => {
    vi.useFakeTimers();

    it('should debounce function calls', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc('arg1', 'arg2');

      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should reset timer on subsequent calls', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc();
      vi.advanceTimersByTime(50);

      debouncedFunc();
      vi.advanceTimersByTime(50);

      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);

      expect(func).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      vi.clearAllTimers();
    });
  });

  describe('throttle', () => {
    vi.useFakeTimers();

    it('should throttle function calls', () => {
      const func = vi.fn();
      const throttledFunc = throttle(func, 100);

      throttledFunc();
      throttledFunc();
      throttledFunc();

      expect(func).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      throttledFunc();

      expect(func).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments to throttled function', () => {
      const func = vi.fn();
      const throttledFunc = throttle(func, 100);

      throttledFunc('arg1', 'arg2');

      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should allow execution after throttle period', () => {
      const func = vi.fn();
      const throttledFunc = throttle(func, 100);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(2);
    });

    afterEach(() => {
      vi.clearAllTimers();
    });
  });

  describe('formatDate', () => {
    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    it('should return "Just now" for timestamps less than 1 minute ago', () => {
      const timestamp = Date.now() - 30000; // 30 seconds ago
      expect(formatDate(timestamp)).toBe('Just now');
    });

    it('should return minutes for timestamps less than 1 hour ago', () => {
      const timestamp = Date.now() - 120000; // 2 minutes ago
      expect(formatDate(timestamp)).toBe('2 minutes ago');
    });

    it('should return singular minute for 1 minute ago', () => {
      const timestamp = Date.now() - 60000; // 1 minute ago
      expect(formatDate(timestamp)).toBe('1 minute ago');
    });

    it('should return hours for timestamps less than 1 day ago', () => {
      const timestamp = Date.now() - 7200000; // 2 hours ago
      expect(formatDate(timestamp)).toBe('2 hours ago');
    });

    it('should return singular hour for 1 hour ago', () => {
      const timestamp = Date.now() - 3600000; // 1 hour ago
      expect(formatDate(timestamp)).toBe('1 hour ago');
    });

    it('should return days for timestamps less than 1 week ago', () => {
      const timestamp = Date.now() - 172800000; // 2 days ago
      expect(formatDate(timestamp)).toBe('2 days ago');
    });

    it('should return singular day for 1 day ago', () => {
      const timestamp = Date.now() - 86400000; // 1 day ago
      expect(formatDate(timestamp)).toBe('1 day ago');
    });

    it('should return formatted date for timestamps older than 1 week', () => {
      const timestamp = Date.now() - 604800000; // 7 days ago
      const result = formatDate(timestamp);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com:8080')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(true); // This is technically a valid URL
    });
  });

  describe('isValidRegex', () => {
    it('should return true for valid regex patterns', () => {
      expect(isValidRegex('^https://.*')).toBe(true);
      expect(isValidRegex('.*\\.com$')).toBe(true);
      expect(isValidRegex('[a-z]+')).toBe(true);
    });

    it('should return false for invalid regex patterns', () => {
      expect(isValidRegex('[invalid(regex')).toBe(false);
      expect(isValidRegex('(?P<invalid>')).toBe(false);
      expect(isValidRegex('[')).toBe(false);
    });

    it('should return true for empty regex', () => {
      expect(isValidRegex('')).toBe(true);
    });
  });

  describe('deepClone', () => {
    it('should deep clone an object', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('should deep clone an array', () => {
      const arr = [1, 2, { a: 3 }];
      const cloned = deepClone(arr);

      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[2]).not.toBe(arr[2]);
    });

    it('should handle nested structures', () => {
      const obj = {
        a: 1,
        b: [2, 3, { c: 4 }],
        d: { e: { f: 5 } },
      };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned.b[2]).not.toBe(obj.b[2]);
      expect(cloned.d.e).not.toBe(obj.d.e);
    });
  });

  describe('isEqual', () => {
    it('should return true for equal primitives', () => {
      expect(isEqual(1, 1)).toBe(true);
      expect(isEqual('a', 'a')).toBe(true);
      expect(isEqual(true, true)).toBe(true);
    });

    it('should return false for different primitives', () => {
      expect(isEqual(1, 2)).toBe(false);
      expect(isEqual('a', 'b')).toBe(false);
      expect(isEqual(true, false)).toBe(false);
    });

    it('should return true for equal objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };

      expect(isEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for different objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };

      expect(isEqual(obj1, obj2)).toBe(false);
    });

    it('should return true for equal arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 3];

      expect(isEqual(arr1, arr2)).toBe(true);
    });

    it('should return false for different arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 4];

      expect(isEqual(arr1, arr2)).toBe(false);
    });

    it('should handle nested structures', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      const obj3 = { a: 1, b: { c: 3 } };

      expect(isEqual(obj1, obj2)).toBe(true);
      expect(isEqual(obj1, obj3)).toBe(false);
    });
  });
});
