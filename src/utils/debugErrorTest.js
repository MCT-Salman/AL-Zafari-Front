// اختبار محاكاة لمشكلة رسالة الخطأ
import { handleApiError } from './errorHandler';

// محاكاة الخطأ الذي يأتي من الـ API
const mockApiError = {
  success: false,
  message: "اسم اللون يجب أن يكون بين 2 و 100 حرف",
  data: {}
};

// محاكاة هيكل الخطأ الذي يصل إلى handleApiError
const mockAxiosError = {
  response: {
    data: {
      success: false,
      message: "اسم اللون يجب أن يكون بين 2 و 100 حرف",
      data: {}
    }
  }
};

// محاكاة هيكل الخطأ المباشر (بدون axios wrapper)
const mockDirectError = {
  success: false,
  message: "اسم اللون يجب أن يكون بين 2 و 100 حرف",
  data: {}
};

console.log('=== Test 1: Axios Error Structure ===');
const result1 = handleApiError(mockAxiosError, 'رسالة افتراضية');
console.log('Result:', result1);

console.log('\n=== Test 2: Direct Error Structure ===');
const result2 = handleApiError(mockDirectError, 'رسالة افتراضية');
console.log('Result:', result2);

console.log('\n=== Test 3: Error with data property ===');
const mockDataError = {
  data: {
    success: false,
    message: "اسم اللون يجب أن يكون بين 2 و 100 حرف",
    data: {}
  }
};
const result3 = handleApiError(mockDataError, 'رسالة افتراضية');
console.log('Result:', result3);

// اختبار الحالة التي ذكرها المستخدم
console.log('\n=== Test 4: User Case ===');
const userCase = {
  success: false,
  message: "اسم اللون يجب أن يكون بين 2 و 100 حرف",
  data: {}
};
const result4 = handleApiError(userCase, 'رسالة افتراضية');
console.log('Result:', result4);

export const testErrorMessage = () => {
  return {
    message: "اسم اللون يجب أن يكون بين 2 و 100 حرف",
    success: false,
    data: {}
  };
};
