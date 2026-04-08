// src/components/common/NotificationsBell.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "../ui/button";
import { notificationsApi } from "../../api/notificationsApi";
import { connectSocket } from "../../lib/socket";
import { toast } from "react-hot-toast";

const parseNotificationData = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default function NotificationsBell({ size = "lg", className = "" }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dedupRef = useRef(new Map());

  const normalized = useMemo(() => {
    return (notifications || []).map(n => ({
      ...n,
      parsedData: parseNotificationData(n.data)
    }));
  }, [notifications]);

  const shouldNotify = (key, windowMs = 8000) => {
    const now = Date.now();
    const lastSeen = dedupRef.current.get(key);
    if (lastSeen && now - lastSeen < windowMs) return false;
    dedupRef.current.set(key, now);
    return true;
  };

  const loadNotifications = async () => {
    try {
      const response = await notificationsApi.getMyNotifications();
      const data = response?.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      const count = response?.data?.count ?? 0;
      setUnreadCount(Number(count) || 0);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const socket = connectSocket(token);

    const handleSocketNotification = (payload) => {
      console.log("[NotificationsBell] Socket notification received:", payload);
      const data = payload?.data ?? payload;
      const key = `${payload?.type || "notification"}:${payload?.title || ""}:${payload?.body || ""}:${data?.productionOrderId || data?.production_order_id || data?.order_id || data?.sales_order_id || ""}`;
      if (!shouldNotify(key, 8000)) return;

      if (payload?.title || payload?.body) {
        toast.success(`${payload.title || "إشعار"}: ${payload.body || ""}`.trim());
      } else if (data?.message) {
        toast.success(data.message);
      }

      // Reload notifications from server to ensure we have the latest
      loadNotifications();
      loadUnreadCount();

      setNotifications(prev => {
        const entry = {
          id: `local-${Date.now()}`,
          title: payload?.title || "إشعار جديد",
          body: payload?.body || data?.message || "",
          type: payload?.type || "GENERAL",
          data: payload?.data ?? null,
          isRead: false,
          isLocal: true,
          link: payload?.link || "",
          created_at: payload?.created_at || new Date().toISOString()
        };
        return [entry, ...(Array.isArray(prev) ? prev : [])].slice(0, 20);
      });
      setUnreadCount(prev => prev + 1);
    };

    // Listen to multiple notification events
    const events = ["notification", "warehouse:notification", "order:notification", "sales:notification"];
    events.forEach(event => socket.on(event, handleSocketNotification));

    return () => {
      events.forEach(event => socket.off(event, handleSocketNotification));
    };
  }, []);

  const markRead = async (note) => {
    if (!note?.id) return;
    try {
      if (!note.isLocal) {
        await notificationsApi.markRead(note.id);
      }
      setNotifications(prev => prev.map(n => (n.id === note.id ? { ...n, isRead: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
      loadUnreadCount();
    } catch (error) {
      toast.error(error?.message || "فشل تحديث الإشعار");
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      loadUnreadCount();
    } catch (error) {
      toast.error(error?.message || "فشل تحديث الإشعارات");
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size={size}
        onClick={() => {
          setOpen(prev => !prev);
          if (!open) {
            loadNotifications();
            loadUnreadCount();
          }
        }}
        className={`border-white/30 bg-white/10 text-white hover:bg-white/20 px-5 py-3 text-base min-w-[120px] ${className}`}
      >
        <Bell className="w-4 h-4 ml-2" />
        الإشعارات
        {unreadCount > 0 && (
          <span className="mr-2 inline-flex items-center justify-center text-xs bg-red-500 text-white rounded-full min-w-[20px] h-5 px-1">
            {unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute -right-10 z-50 mt-2 max-h-[380px] w-[340px] max-w-[calc(100vw-1rem)] overflow-auto rounded-lg border bg-white text-gray-900 shadow-lg">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="font-bold text-sm">الإشعارات الحديثة</span>
            <Button variant="outline" size="sm" onClick={markAllRead}>
              قراءة الكل
            </Button>
          </div>
          {normalized.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">لا توجد إشعارات</div>
          ) : (
            <div className="divide-y">
              {normalized.map(note => (
                <div key={note.id} className={`p-3 ${note.isRead ? "bg-white" : "bg-blue-50"}`}>
                  <div className="text-sm font-semibold">{note.title}</div>
                  {note.body && <div className="text-xs text-gray-600 mt-1">{note.body}</div>}
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-[11px] text-gray-400">{note.created_at ? new Date(note.created_at).toLocaleString("ar-SA") : ""}</div>
                    <div className="flex gap-2">
                      {/* {note.link && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(note.link)}
                        >
                          عرض
                        </Button>
                      )} */}
                      {!note.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markRead(note)}
                        >
                          تم
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
