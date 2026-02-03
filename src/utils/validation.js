export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateLoginForm = (email, password) => {
  const errors = {};
  
  if (!email.trim()) {
    errors.email = 'البريد الإلكتروني مطلوب';
  } else if (!validateEmail(email)) {
    errors.email = 'البريد الإلكتروني غير صالح';
  }
  
  if (!password) {
    errors.password = 'كلمة المرور مطلوبة';
  } else if (!validatePassword(password)) {
    errors.password = 'كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل';
  }
  
  return errors;
};