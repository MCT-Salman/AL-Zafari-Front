// socket-test-client.cjs
// عميل اختبار Socket.IO باستخدام Node.js (CommonJS)

const io = require("socket.io-client");

// الإعدادات
const SERVER_URL = "http://192.168.3.11:3000";
const JWT_TOKEN = "YOUR_JWT_TOKEN_HERE"; // ضع JWT token الصحيح هنا

class SocketTestClient {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  async connect(token = JWT_TOKEN, serverUrl = SERVER_URL) {
    try {
      console.log("🔄 جاري الاتصال بالخادم...");

      const normalized = typeof token === "string" ? token.replace(/^Bearer\s+/i, "") : token;

      this.socket = io(serverUrl, {
        auth: {
          token: normalized,
          authorization: normalized ? `Bearer ${normalized}` : undefined,
        },
        transports: ["websocket", "polling"],
      });

      // مستمعي الأحداث
      this.setupEventListeners();

      return new Promise((resolve, reject) => {
        this.socket.on("connect", () => {
          this.connected = true;
          console.log("✅ تم الاتصال بنجاح!");
          console.log(`📍 Socket ID: ${this.socket.id}`);
          resolve();
        });

        this.socket.on("connect_error", (error) => {
          console.error("❌ فشل الاتصال:", error.message);
          reject(error);
        });
      });
    } catch (error) {
      console.error("❌ خطأ في الاتصال:", error);
      throw error;
    }
  }

  setupEventListeners() {
    this.socket.on("connected", (data) => {
      console.log("🎉 رسالة الاتصال:", data);
    });

    this.socket.on("unread:count", (data) => {
      console.log("📊 عدد الإشعارات غير المقروءة:", data.count);
    });

    this.socket.on("notification:read", (data) => {
      console.log("✅ تم تحديد الإشعار كمقروء:", data);
    });

    this.socket.on("all:notifications:read", (data) => {
      console.log("✅ تم تحديد جميع الإشعارات كمقروءة:", data);
    });

    this.socket.on("notification", (data) => {
      console.log("🔔 إشعار جديد:", data);
    });

    // أحداث محتملة للطلبات (حسب ما هو شائع في مشروعك)
    const logOrders = (event) => (payload) => {
      console.log(`📦 ${event}:`, payload);
    };

    [
      "ORDER_NEW",
      "warehouse:orders",
      "warehouse:order:new",
      "order:new",
      "order:updated",
    ].forEach((event) => this.socket.on(event, logOrders(event)));

    this.socket.on("disconnect", (reason) => {
      this.connected = false;
      console.log("🔌 تم قطع الاتصال:", reason);
    });

    this.socket.on("error", (error) => {
      console.error("❌ خطأ في Socket:", error);
    });
  }

  getUnreadCount() {
    if (this.connected) {
      this.socket.emit("get:unread:count");
      console.log("📤 تم إرسال طلب عدد الإشعارات غير المقروءة");
    } else {
      console.error("❌ غير متصل بالخادم");
    }
  }

  markAsRead(notificationId) {
    if (this.connected) {
      this.socket.emit("mark:read", notificationId);
      console.log(`📤 تم إرسال طلب تحديد الإشعار ${notificationId} كمقروء`);
    } else {
      console.error("❌ غير متصل بالخادم");
    }
  }

  markAllAsRead() {
    if (this.connected) {
      this.socket.emit("mark:all:read");
      console.log("📤 تم إرسال طلب تحديد جميع الإشعارات كمقروءة");
    } else {
      console.error("❌ غير متصل بالخادم");
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
      console.log("🔌 تم قطع الاتصال يدوياً");
    }
  }

  async runTests() {
    console.log("🧪 بدء اختبار Socket.IO...");

    try {
      if (!this.connected) {
        throw new Error("Client is not connected. Call connect() first.");
      }

      this.getUnreadCount();
      await this.sleep(1000);

      this.markAsRead(1);
      await this.sleep(1000);

      this.markAllAsRead();
      await this.sleep(1000);

      console.log("🎉 اكتمل الاختبار بنجاح!");
    } catch (error) {
      console.error("❌ فشل الاختبار:", error);
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function getTokenFromArgs() {
  const args = process.argv.slice(2);
  const tokenIndex = args.findIndex((arg) => arg === "--token" || arg === "-t");

  if (tokenIndex !== -1 && args[tokenIndex + 1]) {
    return args[tokenIndex + 1];
  }

  return null;
}

function getUrlFromArgs() {
  const args = process.argv.slice(2);
  const urlIndex = args.findIndex((arg) => arg === "--url" || arg === "-u");

  if (urlIndex !== -1 && args[urlIndex + 1]) {
    return args[urlIndex + 1];
  }

  return null;
}

async function main() {
  const token = getTokenFromArgs() || JWT_TOKEN;
  const url = getUrlFromArgs() || SERVER_URL;

  if (token === "YOUR_JWT_TOKEN_HERE") {
    console.error("❌ الرجاء وضع JWT token الصحيح في الكود أو تمريره عبر --token");
    console.log(
      "💡 مثال: node socket-test-client.cjs --token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... --url http://192.168.3.11:3000"
    );
    process.exit(1);
  }

  const client = new SocketTestClient();

  await client.connect(token, url);
  await client.runTests();

  setTimeout(() => {
    client.disconnect();
    process.exit(0);
  }, 5000);
}

process.on("SIGINT", () => {
  console.log("\n👋 تم إيقاف التشغيل...");
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SocketTestClient;
