import { useState, useEffect } from "react";

// useMobile hook | ربط الجوال
// Returns true on screens smaller than md (768px)
// يعيد true على الشاشات الأصغر من md
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}
