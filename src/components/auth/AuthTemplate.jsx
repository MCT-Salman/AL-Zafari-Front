// src/components/auth/AuthTemplate.jsx
import { useState } from "react";
import { Eye, EyeOff, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  identifierPlaceholder = "ايميل / اسم المستخدم",
  loading = false, // حالة التحميل من الخارج (اختياري)
  error = "", // رسالة خطأ من الخارج
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  
  // دمج حالة التحميل الداخلية والخارجية
  const isLoading = loading || internalLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setInternalLoading(true);
    try {
      // نمرر البيانات للأب وننتظر الرد
      await onSubmit(formData);
    } catch (err) {
      console.error(err);
      // الخطأ يتم التعامل معه في الأب غالباً، لكن هنا نوقف التحميل
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background" dir="rtl">
      {/* القسم الأيمن: النموذج */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md border-border/60 shadow-xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            {logo && (
              <div className="flex justify-center mb-2">
                <img src={logo} alt="Logo" className="h-16 object-contain" />
              </div>
            )}
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* حقل المعرف */}
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-right block">{identifierLabel}</Label>
                <div className="relative">
                  <Input
                    id="identifier"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    placeholder={identifierPlaceholder}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                </div>
              </div>

              {/* حقل كلمة المرور */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">كلمة المرور</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* رابط نسيت كلمة المرور */}
              {onForgotPassword && (
                <div className="flex justify-end">
                   <button 
                     type="button"
                     onClick={onForgotPassword}
                     className="text-sm text-primary hover:underline px-0"
                   >
                     نسيت كلمة المرور؟
                   </button>
                </div>
              )}

              {/* رسالة الخطأ */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md flex items-center gap-2 text-destructive text-sm font-medium animate-in fade-in-50">
                   <span>⚠️</span> {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
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

      {/* القسم الأيسر: الصورة والترحيب */}
      <div className="hidden lg:flex flex-1 relative bg-muted text-white overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center p-12">
           <div className="max-w-lg space-y-4">
             {heroTitle && <h1 className="text-4xl font-bold tracking-tight">{heroTitle}</h1>}
             {heroDescription && <p className="text-lg text-white/80">{heroDescription}</p>}
           </div>
        </div>
      </div>
    </div>
  );
}