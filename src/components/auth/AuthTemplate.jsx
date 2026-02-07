// src\components\auth\AuthTemplate.jsx
import { useState } from "react";
import { Eye, EyeOff, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export function AuthTemplate({
  title = "تسجيل الدخول",
  description = "أدخل بياناتك للوصول إلى حسابك",
  logo,
  heroImage,
  heroTitle,
  heroDescription,
  onSubmit, // دالة المعالجة (Promise)
  onForgotPassword, // دالة عند النسيان
  identifierLabel = "اسم المستخدم أو الهاتف",
  identifierPlaceholder = "اسم المستخدم",
  loading = false, // حالة التحميل من الخارج (اختياري)
  error = "", // رسالة خطأ من الخارج
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
const navigate = useNavigate()
  // دمج حالة التحميل الداخلية والخارجية
  const isLoading = loading || internalLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setInternalLoading(true);
    try {
      // نمرر البيانات للأب وننتظر الرد
      await onSubmit(formData);
      // تم تسجيل الدخول بنجاح، التوجيه سيتم عبر الأب
    } catch (err) {
      console.error(err);
      // الخطأ يتم التعامل معه في الأب غالباً، لكن هنا نوقف التحميل
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-primary-s" dir="rtl">
      {/* القسم الأيمن: النموذج */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 ">
        <Card className="w-full max-w-[50%] rounded-xl shadow-3xl border border-primary/50 bg-card shadow-primary/55 shadow-2xl ">

          <CardHeader className="text-center space-y-3 pb-6 border-b border-primary">
            {logo && (
              <div className="flex justify-center">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-14 object-contain animate-float"
                />
              </div>
            )}
            <CardTitle className="text-2xl font-bold text-primary-f">
              {title}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* حقل اسم المستخدم */}
              <div className="space-y-1">
                <Label htmlFor="username" className="text-sm font-medium">
                  {identifierLabel}
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder={identifierPlaceholder}
                    className="h-11 pr-10 bg-white border-border focus:border-primary-f"
                    required
                    disabled={isLoading}
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                </div>
              </div>

              {/* كلمة المرور */}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm font-medium">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="h-11 pr-10 bg-white border-border focus:border-primary-f"
                    required
                    disabled={isLoading}
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 " />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* رسالة الخطأ */}
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive animate-in fade-in-50">
                  {error}
                </div>
              )}

              {/* زر الدخول */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-white font-medium rounded-lg cursor-pointer
                       bg-primary-f
                       hover:bg-primary
                       transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* القسم الأيسر: الصورة */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary-f to-secondary-s/55" />

        <div className="relative z-10 w-full h-full flex items-center justify-center text-center px-12">
          <div className="max-w-1/2 space-y-4">
            {heroTitle && (
              <h1 className="text-4xl font-bold text-primary leading-tight">
                {heroTitle}
              </h1>
            )}
            {heroDescription && (
              <p className="text-primary/80 text-lg">
                {heroDescription}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>

  );
}