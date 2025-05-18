/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Creates a throttled function that only invokes func at most once per wait period
 * @param func Function to throttle
 * @param wait Wait time in milliseconds
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Creates a function that is only called once
 * @param func Function to call once
 */
export declare function once<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => ReturnType<T>;
/**
 * Creates a memoized function that caches results
 * @param func Function to memoize
 */
export declare function memoize<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => ReturnType<T>;
