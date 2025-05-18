/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 */
export function debounce(func, wait) {
    let timeout = null;
    return function (...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}
/**
 * Creates a throttled function that only invokes func at most once per wait period
 * @param func Function to throttle
 * @param wait Wait time in milliseconds
 */
export function throttle(func, wait) {
    let timeout = null;
    let lastArgs = null;
    let lastCallTime = 0;
    return function (...args) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallTime;
        lastArgs = args;
        if (timeSinceLastCall >= wait) {
            lastCallTime = now;
            func(...args);
        }
        else if (timeout === null) {
            timeout = setTimeout(() => {
                lastCallTime = Date.now();
                timeout = null;
                if (lastArgs !== null) {
                    func(...lastArgs);
                }
            }, wait - timeSinceLastCall);
        }
    };
}
/**
 * Creates a function that is only called once
 * @param func Function to call once
 */
export function once(func) {
    let called = false;
    let result;
    return function (...args) {
        if (!called) {
            called = true;
            result = func(...args);
        }
        return result;
    };
}
/**
 * Creates a memoized function that caches results
 * @param func Function to memoize
 */
export function memoize(func) {
    const cache = new Map();
    return function (...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = func(...args);
        cache.set(key, result);
        return result;
    };
}
//# sourceMappingURL=func-utils.js.map