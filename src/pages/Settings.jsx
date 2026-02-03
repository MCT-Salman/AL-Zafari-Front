import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Bell, Moon, Globe, Shield, Key, Languages } from "lucide-react";
import { useState } from "react";

// Settings page | صفحة الإعدادات
export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    rtl: true,
    language: 'ar',
    timezone: 'gmt+3'
  });

  const [loading, setLoading] = useState(false);

  const handleSwitchChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-primary-s rounded-lg p-6 border border-border">
        <h1 className="text-2xl font-bold text-text-strong mb-2">الإعدادات • Settings</h1>
        <p className="text-text-subtle">تخصيص تجربة استخدام النظام • Customize your system experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Categories */}
        <div className="lg:col-span-1">
          <Card className="bg-surface border border-border">
            <CardHeader>
              <CardTitle className="text-text-strong">الفئات • Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-text-strong hover:bg-primary-alpha"
              >
                <SettingsIcon size={16} className="ml-2" />
                عام • General
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-text-strong hover:bg-primary-alpha"
              >
                <Shield size={16} className="ml-2" />
                الأمان • Security
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-text-strong hover:bg-primary-alpha"
              >
                <Languages size={16} className="ml-2" />
                اللغة • Language
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <Card className="bg-surface border border-border">
            <CardHeader>
              <CardTitle className="text-text-strong flex items-center gap-2">
                <SettingsIcon size={20} />
                الإعدادات العامة • General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-text-subtle" />
                  <Label htmlFor="notifications" className="text-text-strong">الإشعارات</Label>
                </div>
                <Switch 
                  id="notifications" 
                  checked={settings.notifications}
                  onCheckedChange={(checked) => handleSwitchChange('notifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon size={16} className="text-text-subtle" />
                  <Label htmlFor="dark-mode" className="text-text-strong">الوضع الليلي</Label>
                </div>
                <Switch 
                  id="dark-mode" 
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => handleSwitchChange('darkMode', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-text-subtle" />
                  <Label htmlFor="rtl" className="text-text-strong">اتجاه RTL</Label>
                </div>
                <Switch 
                  id="rtl" 
                  checked={settings.rtl}
                  onCheckedChange={(checked) => handleSwitchChange('rtl', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-surface border border-border">
            <CardHeader>
              <CardTitle className="text-text-strong flex items-center gap-2">
                <Shield size={20} />
                الأمان • Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start border-border text-text-strong hover:bg-primary-alpha"
              >
                <Key size={16} className="ml-2" />
                تغيير كلمة المرور
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-border text-text-strong hover:bg-primary-alpha"
              >
                <Shield size={16} className="ml-2" />
                تفعيل المصادقة الثنائية
              </Button>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card className="bg-surface border border-border">
            <CardHeader>
              <CardTitle className="text-text-strong flex items-center gap-2">
                <Languages size={20} />
                اللغة والمنطقة • Language & Region
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="lang" className="text-text-strong">اللغة</Label>
                <select 
                  id="lang" 
                  value={settings.language}
                  onChange={(e) => handleSwitchChange('language', e.target.value)}
                  className="w-full mt-1 p-2 bg-primary-alpha border border-border rounded-md text-text-strong"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <Label htmlFor="tz" className="text-text-strong">المنطقة الزمنية</Label>
                <select 
                  id="tz" 
                  value={settings.timezone}
                  onChange={(e) => handleSwitchChange('timezone', e.target.value)}
                  className="w-full mt-1 p-2 bg-primary-alpha border border-border rounded-md text-text-strong"
                >
                  <option value="gmt+3">GMT+3 (الرياض)</option>
                  <option value="gmt+0">GMT+0 (London)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-secondary-s hover:bg-secondary-f text-primary-s"
            >
              {loading ? "جاري الحفظ..." : "حفظ الإعدادات • Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
