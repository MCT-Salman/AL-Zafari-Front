// src\pages\Profile.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/authApi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  User,
  Phone,
  AtSign,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

// الألوان المستخدمة
const colors = {
  primaryF: "#004563",
  primaryS: "#F6F6F6",
  secondaryF: "#F7A823",
  secondaryS: "#e94e1b",
  secondaryT: "#0FAEDD",
  secondaryFo: "#878787"
};

const Profile = () => {
  useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authApi.getProfile();
        if (response.data) {
          setFormData({
            full_name: response.data.full_name || '',
            username: response.data.username || '',
            phone: (response.data.phone || "").replace(/^(\+963|00963|963)/, "").replace(/^0+/, ""),
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('فشل في تحميل البيانات الشخصية');
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').replace(/^0+/, '');
      setFormData((prev) => ({ ...prev, phone: digitsOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const dataToSend = {
        ...formData,
        // Prepend +963 to phone if not already present
        phone: formData.phone
          ? (formData.phone.startsWith('+') ? formData.phone : `+963${formData.phone.replace(/\D/g, '').replace(/^0+/, '')}`)
          : '',
      };
      const response = await authApi.updateProfile(dataToSend);
      setMessage(response.message || 'تم تحديث الملف الشخصي بنجاح');
      if (response.data) {
        setFormData({
          full_name: response.data.full_name,
          username: response.data.username,
          // Strip +963 prefix for display in the input
          phone: (response.data.phone || "").replace(/^(\+963|00963|963)/, "").replace(/^0+/, ""),
        });
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ في تحديث الملف الشخصي');
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-s py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: colors.primaryF }}>
            الملف الشخصي
          </h1>
          <p className="text-base font-medium" style={{ color: colors.secondaryFo }}>
            إدارة معلوماتك الشخصية وإعدادات الحساب
          </p>
        </div>

        {/* Avatar Card */}
        {/* <Card className="border-2 border-[#E5E5E5] shadow-lg bg-white overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div 
                  className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-xl border-4 border-white"
                  style={{ backgroundColor: colors.primaryF }}
                >
                  {getInitials()}
                </div>
                <button 
                  className="absolute bottom-0 left-0 p-2 rounded-full bg-white shadow-lg border-2 hover:scale-110 transition-transform duration-300"
                  style={{ borderColor: colors.secondaryF }}
                >
                  <Camera className="w-5 h-5" style={{ color: colors.secondaryF }} />
                </button>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold" style={{ color: colors.primaryF }}>
                  {formData.full_name || 'المستخدم'}
                </h2>
                <p className="text-sm font-medium" style={{ color: colors.secondaryFo }}>
                  @{formData.username || 'username'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Form Card */}
        <Card className="border-2 border-[#E5E5E5] shadow-lg bg-white overflow-hidden">
          <div className="h-1.5 w-full" style={{ backgroundColor: colors.secondaryF }} />
          {/* <CardHeader className="pb-2">
            <CardTitle className="text-lg font-black flex items-center gap-2" style={{ color: colors.primaryF }}>
              <User className="w-5 h-5" style={{ color: colors.secondaryF }} />
              معلومات الحساب
            </CardTitle>
          </CardHeader> */}
          <CardContent className="p-6">

            {/* Success Message */}
            {message && (
              <div className="mb-6 p-4 rounded-xl border-2 flex items-center gap-3 bg-primary-f/5" style={{ borderColor: colors.primaryF }}>
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: colors.primaryF }} />
                <span className="font-bold text-sm" style={{ color: colors.primaryF }}>{message}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl border-2 flex items-center gap-3 bg-secondary-s/5" style={{ borderColor: colors.secondaryS }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: colors.secondaryS }} />
                <span className="font-bold text-sm" style={{ color: colors.secondaryS }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Full Name Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="full_name"
                  className="text-sm font-bold flex items-center gap-2"
                  style={{ color: colors.primaryF }}
                >
                  <User className="w-4 h-4" style={{ color: colors.secondaryF }} />
                  الاسم الكامل
                </Label>
                <div className="relative">
                  <Input
                    id="full_name"
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="أدخل اسمك الكامل"
                    className="h-12 pr-12 pl-4 bg-primary-s border-2 border-[#E5E5E5] rounded-xl focus:border-primary-f focus:ring-4 focus:ring-primary-f/10 transition-all duration-300 text-primary-f placeholder:text-secondary-fo"
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <User className="w-5 h-5" style={{ color: colors.secondaryFo }} />
                  </div>
                </div>
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-sm font-bold flex items-center gap-2"
                  style={{ color: colors.primaryF }}
                >
                  <AtSign className="w-4 h-4" style={{ color: colors.secondaryF }} />
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم المستخدم"
                    className="h-12 pr-12 pl-4 bg-primary-s border-2 border-[#E5E5E5] rounded-xl focus:border-primary-f focus:ring-4 focus:ring-primary-f/10 transition-all duration-300 text-primary-f placeholder:text-secondary-fo"
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <AtSign className="w-5 h-5" style={{ color: colors.secondaryFo }} />
                  </div>
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-bold flex items-center gap-2"
                  style={{ color: colors.primaryF }}
                >
                  <Phone className="w-4 h-4" style={{ color: colors.secondaryF }} />
                  رقم الهاتف
                </Label>
                <div className="flex items-center gap-0">
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="912345678"
                    className="h-12 pl-4 bg-primary-s border-2 border-[#E5E5E5] rounded-l-xl rounded-r-none focus:border-primary-f focus:ring-4 focus:ring-primary-f/10 transition-all duration-300 text-primary-f placeholder:text-secondary-fo"
                    disabled={loading}
                  />
                  <span
                    className="flex items-center h-12 px-3 font-bold text-sm rounded-l-xl border-2 border-r-0 border-[#E5E5E5] bg-primary-s"
                    dir='ltr'
                    style={{ color: colors.primaryF }}
                  >+963</span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-white font-bold text-base rounded-xl border-0 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors.primaryF }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>جاري التحديث...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" />
                    <span>حفظ التغييرات</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        {/* <Card className="border-2 border-[#E5E5E5] bg-primary-s">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div 
                className="p-2 rounded-lg bg-white border-2"
                style={{ borderColor: colors.secondaryT }}
              >
                <AlertCircle className="w-5 h-5" style={{ color: colors.secondaryT }} />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1" style={{ color: colors.primaryF }}>
                  معلومة هامة
                </h3>
                <p className="text-xs font-medium leading-relaxed" style={{ color: colors.secondaryFo }}>
                  يمكنك تحديث معلوماتك الشخصية في أي وقت. تأكد من صحة رقم الهاتف لاستلام الإشعارات الهامة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
};

export default Profile;
