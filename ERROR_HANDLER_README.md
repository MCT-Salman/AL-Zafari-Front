# معالج الأخطاء الموحد - ErrorHandler

## نظرة عامة

تم إنشاء معالج أخطاء موحد لجميع API calls في المشروع لضمان عرض رسائل خطأ متسقة وواضحة للمستخدم.

## الملفات

### 1. `src/utils/errorHandler.js`
يحتوي على الدوال المساعدة لمعالجة الأخطاء:
- `handleApiError(error, defaultMessage)` - معالجة الأخطاء من API
- `isSuccessResponse(response)` - التحقق من نجاح الريسبونس
- `getSuccessMessage(response, defaultMessage)` - استخراج رسالة النجاح

### 2. `src/api/axiosConfig.js`
يحتوي على interceptor لمعالجة الأخطاء بشكل مركزي.

## كيفية الاستخدام

### في API Files:

```javascript
import { handleApiError } from "../utils/errorHandler";

export const exampleApi = {
  getData: async () => {
    try {
      const response = await axiosInstance.get('/example');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'رسالة الخطأ الافتراضية');
    }
  }
};
```

### في Components:

```javascript
try {
  const result = await exampleApi.getData();
  toast.success(result.message || 'تمت العملية بنجاح');
} catch (error) {
  // handleApiError يعيد كائن يحتوي على message و success و data
  toast.error(error.message);
}
```

## ترتيب البحث عن رسالة الخطأ

يقوم `handleApiError` بالبحث عن رسالة الخطأ بالترتيب التالي:

1. **message** - إذا كان نص
2. **details** - إذا كان نص، مصفوفة، أو كائن
3. **error** - إذا كان نص
4. **errors** - مصفوفة أو كائن من الأخطاء
5. **response** نفسه - إذا كان نص
6. **Status Code** - رسائل جاهزة لكل كود HTTP
7. **Default Message** - الرسالة المحددة في الدالة

## رسائل Status Codes

- **400**: طلب غير صالح
- **401**: غير مصرح بالوصول
- **403**: ممنوع الوصول
- **404**: المورد غير موجود
- **422**: بيانات غير صالحة
- **429**: طلبات كثيرة جداً
- **500**: خطأ في الخادم
- **502**: الخادم غير متاح
- **503**: خدمة غير متاحة
- **504**: انتهت مهلة الخادم

## الملفات المحدثة

تم تحديث الملفات التالية لاستخدام معالج الأخطاء الموحد:

### ✅ مكتمل
- `invoiceApi.js` - جميع الدوال
- `orderApi.js` - جميع الدوال  
- `customerApi.js` - جميع الدوال
- `authApi.js` - جميع الدوال
- `batchApi.js` - جميع الدوال

### 🔄 قيد التحديث
- `colorApi.js`
- `constantApi.js`
- `materialApi.js`
- `priceColorApi.js`
- `productionApi.js`
- `rulerApi.js`
- `settingApi.js`
- `userApi.js`

## المميزات

### ✨ معالجة ذكية للأخطاء
- دعم مختلف تنسيقات الريسبونس
- رسائل خطأ مخصصة لكل status code
- دعم اللغة العربية

### 🛡️ أمان وموثوقية
- التحقق من صحة البيانات قبل المعالجة
- معالجة الحالات الخاصة (لا يوجد رد، مشاكل شبكة)
- الحفاظ على البيانات الأصلية في الريسبونس

### 📊 معلومات شاملة
- إرجاع كائن يحتوي على:
  - `message` - رسالة الخطأ المعروضة للمستخدم
  - `success` - دائماً false للأخطاء
  - `status` - كود HTTP إن وجد
  - `data` - الريسبونس الأصلي كاملاً

## مثال على الاستخدام الكامل

```javascript
// API
export const userApi = {
  updateUser: async (id, userData) => {
    try {
      const response = await axiosInstance.put(`/user/${id}`, userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'فشل في تحديث المستخدم');
    }
  }
};

// Component
const handleUpdate = async () => {
  try {
    const result = await userApi.updateUser(userId, userData);
    if (isSuccessResponse(result)) {
      toast.success(getSuccessMessage(result, 'تم تحديث المستخدم بنجاح'));
    }
  } catch (error) {
    toast.error(error.message);
    // يمكن استخدام error.data للوصول للبيانات الأصلية من الخادم
    console.log('Original error data:', error.data);
  }
};
```

## الفوائد

1. **تجربة مستخدم أفضل** - رسائل خطأ واضحة ومفهومة
2. **كود أنظف** - لا تكرار في معالجة الأخطاء
3. **صيانة أسهل** - تعديل مكان واحد لتحديث جميع رسائل الخطأ
4. **تتبع أفضل** - معلومات شاملة عن الأخطاء للتشخيص
