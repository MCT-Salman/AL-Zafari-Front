
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/authApi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from '../components/ui/card';

const Profile = () => {
  const { user } = useAuth();
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
            phone: response.data.phone || '',
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await authApi.updateProfile(formData);
      setMessage(response.message || 'تم تحديث الملف الشخصي بنجاح');
      // Update form with the returned data
      if (response.data) {
        setFormData({
          full_name: response.data.full_name,
          username: response.data.username,
          phone: response.data.phone,
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">الملف الشخصي</h1>

          {message && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                الاسم الكامل
              </label>
              <Input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="أدخل اسمك الكامل"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                اسم المستخدم
              </label>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="أدخل اسم المستخدم"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                رقم الهاتف
              </label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="أدخل رقم الهاتف"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'جاري التحديث...' : 'تحديث الملف الشخصي'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
