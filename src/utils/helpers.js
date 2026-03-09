// src/utils/helpers.js

/**
 * Convert Arabic numerals (٠١٢٣٤٥٦٧٨٩) to English numerals (0123456789)
 * @param {string|number} input - The input string or number containing Arabic numerals
 * @returns {string} - The input with Arabic numerals converted to English
 */
export const convertArabicToEnglishNumbers = (input) => {
    if (input === null || input === undefined) return input;

    const arabicNumbers = '٠١٢٣٤٥٦٧٨٩';
    const englishNumbers = '0123456789';

    let result = String(input);

    // Replace each Arabic numeral with its English equivalent
    for (let i = 0; i < arabicNumbers.length; i++) {
        const arabicDigit = arabicNumbers[i];
        const englishDigit = englishNumbers[i];
        result = result.replace(new RegExp(arabicDigit, 'g'), englishDigit);
    }

    return result;
};

/**
 * Convert Arabic numerals in a number and return as number type
 * @param {string|number} input - The input containing Arabic numerals
 * @returns {number} - The converted number
 */
export const parseArabicNumber = (input) => {
    if (input === null || input === undefined) return NaN;
    const converted = convertArabicToEnglishNumbers(input);
    return parseFloat(converted);
};

/**
 * Format currency with Arabic numeral conversion
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency symbol (default: 'ل.س')
 * @returns {string} - Formatted currency string with English numerals
 */
export const formatCurrencyWithEnglishNumbers = (amount, currency = 'ل.س') => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0';

    // Format the number with English numerals
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);

    return `${formatted} ${currency}`;
};
