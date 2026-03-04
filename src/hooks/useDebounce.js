// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Hook لتأخير تنفيذ الدوال (Debounce)
 * @param {any} value - القيمة المراد تأخيرها
 * @param {number} delay - وقت التأخير بالملي ثانية
 * @returns {any} القيمة بعد التأخير
 */
export function useDebounce(value, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // set timeout لتأخير تحديث القيمة
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // cleanup function لإلغاء timeout إذا تغيرت القيمة قبل انتهاء الوقت
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook لتأخير تنفيذ دالة (Debounce Function)
 * @param {Function} fn - الدالة المراد تأخيرها
 * @param {number} delay - وقت التأخير بالملي ثانية
 * @returns {Function} الدالة مع التأخير
 */
export function useDebounceFn(fn, delay = 500) {
    const [timeoutId, setTimeoutId] = useState(null);

    const debouncedFn = (...args) => {
        // إلغاء timeout السابق إذا وجد
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // إنشاء timeout جديد
        const newTimeoutId = setTimeout(() => {
            fn(...args);
        }, delay);

        setTimeoutId(newTimeoutId);
    };

    // cleanup عند إزالة الـ component
    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

    return debouncedFn;
}

export default useDebounce;