// src\components\auth\AuthTemplate.jsx
import { useState } from "react";
import { Eye, EyeOff, Lock, User, Loader2, ArrowLeft, AlertCircle, Shield, Mail, ArrowDown } from "lucide-react";
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
    <div className="h-screen w-full flex flex-col lg:flex-row bg-primary-s" dir="rtl">
      {/* القسم الأيمن: النموذج */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-0 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* خلفية زخرفية */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 lg:w-80 lg:h-80 bg-primary-f/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 lg:w-80 lg:h-80 bg-secondary-f/30 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <Card className="w-120  relative z-10 border-0 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl overflow-hidden mx-auto">
          {/* شريط علوي ملون */}
          <div className="h-1 w-full bg-gradient-to-r from-primary-f via-secondary-f to-primary-f" />

          <CardHeader className="text-center space-y-3 lg:space-y-4 pb-6 lg:pb-8 pt-6 lg:pt-8 px-4 sm:px-6">
            {logo && (
              <div className="flex justify-center mb-2">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary-f/20 rounded-2xl blur-xl transform scale-100 group-hover:scale-110 transition-transform duration-500" />
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-12 lg:h-16 object-contain relative z-10 drop-shadow-lg"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <CardTitle className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary-f to-secondary-f bg-clip-text text-transparent">
                {title}
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
                {description}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 lg:px-8 pb-6 lg:pb-8">
            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
              {/* حقل اسم المستخدم */}
              <div className="space-y-1.5 lg:space-y-2">
                <Label htmlFor="username" className="text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary-f" />
                  {identifierLabel}
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder={identifierPlaceholder}
                    className="h-10 lg:h-12 pr-10 lg:pr-12 pl-3 lg:pl-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-lg lg:rounded-xl focus:border-primary-f focus:ring-2 lg:focus:ring-4 focus:ring-primary-f/10 transition-all duration-300 text-sm lg:text-base text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                </div>
              </div>

              {/* كلمة المرور */}
              <div className="space-y-1.5 lg:space-y-2">
                <Label htmlFor="password" className="text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary-f" />
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="h-10 lg:h-12 pr-20 lg:pr-24 pl-3 lg:pl-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-lg lg:rounded-xl focus:border-primary-f focus:ring-2 lg:focus:ring-4 focus:ring-primary-f/10 transition-all duration-300 text-sm lg:text-base text-slate-800 dark:text-slate-200 placeholder:text-slate-400 tracking-wider"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 lg:h-8 lg:w-8 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md lg:rounded-lg transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-500" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-500" />
                      )}
                    </Button>
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Shield className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                </div>
              </div>

              {/* رسالة الخطأ */}
              {error && (
                <div className="rounded-lg lg:rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 lg:p-4 text-xs lg:text-sm text-red-600 dark:text-red-400 animate-in slide-in-from-top-2 flex items-center gap-2 shadow-sm">
                  <AlertCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* زر الدخول */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 lg:h-12 text-white font-bold text-sm lg:text-lg rounded-lg lg:rounded-xl cursor-pointer bg-gradient-to-r from-primary-f to-secondary-f hover:from-primary-f/90 hover:to-secondary-f/90 hover:shadow-lg hover:shadow-primary-f/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin" />
                    <span className="text-sm lg:text-base">جاري التحقق...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-sm lg:text-base">تسجيل الدخول</span>
                    <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* القسم الأيسر: الصورة */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen relative overflow-hidden">
        {/* طبقة الصورة الأساسية */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />

        {/* طبقة تدرج ملونة عصرية */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-f/90 via-primary-f/60 to-secondary-f/80" />

        {/* طبقة إضافية للعمق */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

        {/* نمط زخرفي شبكي */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* دوائر زخرفية متحركة */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/30 rounded-full blur-3xl animate-pulse" />
        {/* <div className="absolute bottom-10 right-10 w-80 h-80 bg-secondary-f/5 rounded-full blur-3xl animate-pulse delay-1000" /> */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-f/50 rounded-full blur-3xl animate-pulse delay-500" />

        {/* خطوط زخرفية */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-px h-40 bg-gradient-to-b from-transparent via-white to-transparent" />
          <div className="absolute bottom-20 left-20 w-px h-40 bg-gradient-to-b from-transparent via-white to-transparent" />
        </div>

        {/* المحتوى */}
        <div className="relative z-10 w-full h-full flex items-center justify-center text-center p-8 xl:p-12">
          <div className="space-y-6 lg:space-y-8 w-full ">
            {heroTitle && (
              <div className="relative space-y-4">
                <h1 className="text-4xl xl:text-6xl 2xl:text-7xl font-black text-white leading-tight drop-shadow-2xl">
                  {heroTitle}
                </h1>
                {/* خط زخرفي تحت العنوان */}
                <div className="flex items-center justify-center gap-2">
                  <div className="h-1 w-12 bg-secondary-f rounded-full" />
                  <div className="h-1 w-4 bg-white/60 rounded-full" />
                  <div className="h-1 w-12 bg-secondary-f rounded-full" />
                </div>
              </div>
            )}

            {heroDescription && (
              <p className="text-white/95 text-lg xl:text-xl 2xl:text-2xl font-medium leading-relaxed drop-shadow-lg mx-auto">
                {heroDescription}
              </p>
            )}

            {/* عناصر زخرفية إضافية */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-secondary-f rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>

        {/* شريط جانبي زخرفي */}
        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-secondary-f via-white/50 to-secondary-f" />

        {/* زاوية زخرفية */}
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-secondary-f/20 to-transparent" />
      </div>
    </div>

  );
}

{/* <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover opacity-10 bg-center scale-90"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/55 to-primary-s/65" />

        <div className="relative z-10 w-full h-full flex items-center justify-center text-center px-12">
          <div className=" space-y-4">
            {heroTitle && (
              <h1 className="text-6xl font-bold text-primary-f leading-tight">
                {heroTitle}
              </h1>
            )}
            {heroDescription && (
              <p className="text-secondary-f text-xl font-bold">
                {heroDescription}
              </p>
            )}
          </div>
        </div>
      </div> */}