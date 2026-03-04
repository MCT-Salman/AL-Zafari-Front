// src/hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

/**
 * Hook للتخزين المحلي (localStorage)
 * @param {string} key - مفتاح التخزين
 * @param {any} initialValue - القيمة الابتدائية
 * @returns {[any, Function]} القيمة ودالة التحديث
 */
export function useLocalStorage(key, initialValue) {
    // دالة للحصول على القيمة المخزنة
    const getStoredValue = () => {
        try {
            // محاولة الحصول على القيمة من localStorage
            const item = window.localStorage.getItem(key);
            // إذا كانت موجودة، قم بتحليلها وإرجاعها
            if (item) {
                return JSON.parse(item);
            }
            // إذا لم تكن موجودة، قم بتخزين القيمة الابتدائية
            if (typeof initialValue === 'function') {
                return initialValue();
            }
            return initialValue;
        } catch (error) {
            // في حالة الخطأ، أعد القيمة الابتدائية
            console.warn(`Error reading localStorage key "${key}":`, error);
            if (typeof initialValue === 'function') {
                return initialValue();
            }
            return initialValue;
        }
    };

    // الحالة الأولية
    const [storedValue, setStoredValue] = useState(getStoredValue);

    // دالة لتحديث القيمة في localStorage وفي الحالة
    const setValue = (value) => {
        try {
            // السماح بتمرير دالة للتحديث
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            
            // تحديث الحالة
            setStoredValue(valueToStore);
            
            // تحديث localStorage
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    // الاستماع للتغييرات من النوافذ الأخرى (اختياري)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === key && e.newValue !== JSON.stringify(storedValue)) {
                try {
                    setStoredValue(JSON.parse(e.newValue));
                } catch (error) {
                    console.warn(`Error parsing localStorage key "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, storedValue]);

    return [storedValue, setValue];
}

/**
 * Hook للتخزين المحلي مع دعم انتهاء الصلاحية
 * @param {string} key - مفتاح التخزين
 * @param {any} initialValue - القيمة الابتدائية
 * @param {number} ttl - وقت الحياة بالمللي ثانية (اختياري)
 * @returns {[any, Function]} القيمة ودالة التحديث
 */
export function useLocalStorageWithExpiry(key, initialValue, ttl) {
    const getStoredValue = () => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                const { value, expiry } = JSON.parse(item);
                
                // التحقق من انتهاء الصلاحية
                if (expiry && Date.now() > expiry) {
                    window.localStorage.removeItem(key);
                    return typeof initialValue === 'function' ? initialValue() : initialValue;
                }
                
                return value;
            }
            return typeof initialValue === 'function' ? initialValue() : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return typeof initialValue === 'function' ? initialValue() : initialValue;
        }
    };

    const [storedValue, setStoredValue] = useState(getStoredValue);

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            
            const item = {
                value: valueToStore,
                expiry: ttl ? Date.now() + ttl : null
            };
            
            window.localStorage.setItem(key, JSON.stringify(item));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
}

export default useLocalStorage;