// src/utils/errorHandler.js

/**
 * دالة موحدة لمعالجة رسائل الخطأ من الريسبونس
 * @param {Object} error - كائن الخطأ من API
 * @param {string} defaultMessage - رسالة الخطأ الافتراضية
 * @returns {Object} - كائن يحتوي على رسالة الخطأ المناسبة
 */
export const handleApiError = (error, defaultMessage = 'حدث خطأ غير متوقع') => {
  // إذا كان الخطأ يحتوي على رسالة محددة مسبقاً (مثل من axios interceptor)
  if (error.message && error.message !== error.originalMessage) {
    return { message: error.message, success: false };
  }

  // استخراج الريسبونس من أماكن مختلفة
  let response = error.response?.data;
  
  // إذا كان error نفسه هو الريسبونس (حالة بعض الـ API)
  if (!response && error.success !== undefined && error.message !== undefined) {
    response = error;
  }
  
  // إذا كان error.data هو الريسبونس
  if (!response && error.data) {
    response = error.data;
  }

  // إذا كان error.message يحتوي على الريسبونس كـ string (حالة خاصة)
  if (!response && error.message && typeof error.message === 'string' && error.message.includes('اسم اللون')) {
    response = error;
  }

  if (!response) {
    // لا يوجد رد من الخادم (مشاكل شبكة، timeout، إلخ)
    return { 
      message: error.message || 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.', 
      success: false 
    };
  }

  // معالجة مختلف حالات الريسبونس
  let message = defaultMessage;

  // 1. التحقق من حقل message
  if (response.message && typeof response.message === 'string') {
    message = response.message;
  }
  // 2. التحقق من حقل details
  else if (response.details) {
    if (typeof response.details === 'string') {
      message = response.details;
    } else if (Array.isArray(response.details)) {
      message = response.details.join('، ');
    } else {
      message = JSON.stringify(response.details);
    }
  }
  // 3. التحقق من حقل error
  else if (response.error && typeof response.error === 'string') {
    message = response.error;
  }
  // 4. التحقق من حقل errors (مجموعة أخطاء)
  else if (response.errors) {
    if (Array.isArray(response.errors)) {
      message = response.errors.join('، ');
    } else if (typeof response.errors === 'object') {
      const errorMessages = Object.values(response.errors).flat();
      message = errorMessages.join('، ');
    } else {
      message = JSON.stringify(response.errors);
    }
  }
  // 5. إذا كان الريسبونس نفسه نص
  else if (typeof response === 'string') {
    message = response;
  }
  // 6. التحقق من status code
  else if (error.response?.status) {
    const statusMessages = {
      400: 'طلب غير صالح. يرجى التحقق من البيانات المرسلة.',
      401: 'غير مصرح بالوصول. يرجى تسجيل الدخول مرة أخرى.',
      403: 'ممنوع الوصول. ليس لديك الصلاحيات الكافية.',
      404: 'المورد المطلوب غير موجود.',
      422: 'بيانات غير صالحة. يرجى التحقق من جميع الحقول.',
      429: 'طلبات كثيرة جداً. يرجى المحاولة مرة أخرى لاحقاً.',
      500: 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.',
      502: 'الخادم غير متاح حالياً.',
      503: 'خدمة غير متاحة. يرجى المحاولة مرة أخرى لاحقاً.',
      504: 'انتهت مهلة الخادم.'
    };
    
    message = statusMessages[error.response.status] || `خطأ ${error.response.status}: ${defaultMessage}`;
  }

  return {
    message,
    success: false,
    status: error.response?.status,
    data: response
  };
};

/**
 * دالة للتحقق مما إذا كان الريسبونس ناجحاً
 * @param {Object} response - رد الـ API
 * @returns {boolean} - هل الريسبونس ناجح
 */
export const isSuccessResponse = (response) => {
  return response?.success === true || response?.status === 'success' || (response?.data && !response?.error);
};

/**
 * دالة لاستخراج رسالة النجاح من الريسبونس
 * @param {Object} response - رد الـ API
 * @param {string} defaultMessage - رسالة النجاح الافتراضية
 * @returns {string} - رسالة النجاح
 */
export const getSuccessMessage = (response, defaultMessage = 'تمت العملية بنجاح') => {
  if (response?.message && typeof response.message === 'string') {
    return response.message;
  }
  if (response?.details && typeof response.details === 'string') {
    return response.details;
  }
  return defaultMessage;
};
