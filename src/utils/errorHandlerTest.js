// اختبار معالج الأخطاء
import { handleApiError } from './errorHandler';

// اختبار الحالة التي ذكرها المستخدم
const testErrorResponse = {
  success: false,
  message: "اسم اللون يجب أن يكون بين 2 و 100 حرف",
  data: {}
};

// محاكاة خطأ من API
const mockError = {
  success: false,
  message: "اسم اللون يجب أن يكون بين 2 و 100 حرف",
  data: {}
};

// اختبار المعالج
const result = handleApiError(mockError, 'رسالة افتراضية');
console.log('Test Result:', result);
/*
Expected Output:
{
  message: "اسم اللون يجب أن يكون بين 2 و 100 حرف",
  success: false,
  data: {
    success: false,
    message: "اسم اللون يجب أن يكون بين 2 و 100 حرف",
    data: {}
  }
}
*/

export default function testErrorHandler() {
  // اختبار مختلف الحالات
  const testCases = [
    {
      name: "رسالة message عادية",
      error: { success: false, message: "اسم اللون يجب أن يكون بين 2 و 100 حرف", data: {} },
      expected: "اسم اللون يجب أن يكون بين 2 و 100 حرف"
    },
    {
      name: "رسالة details",
      error: { success: false, details: "تفاصيل الخطأ", data: {} },
      expected: "تفاصيل الخطأ"
    },
    {
      name: "رسالة error",
      error: { success: false, error: "خطأ في الطلب", data: {} },
      expected: "خطأ في الطلب"
    },
    {
      name: "رسالة errors array",
      error: { success: false, errors: ["خطأ 1", "خطأ 2"], data: {} },
      expected: "خطأ 1، خطأ 2"
    },
    {
      name: "رسالة errors object",
      error: { success: false, errors: { name: "اسم مطلوب", email: "بريد مطلوب" }, data: {} },
      expected: "اسم مطلوب، بريد مطلوب"
    }
  ];

  testCases.forEach(testCase => {
    const result = handleApiError(testCase.error, 'رسالة افتراضية');
    console.log(`✅ ${testCase.name}: ${result.message === testCase.expected ? 'PASS' : 'FAIL'}`);
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Got: ${result.message}`);
    console.log('');
  });
}
