// src/components/common/QRGenerator.jsx
import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { QrCode, Download, Printer } from "lucide-react";

export default function QRGenerator({ orderData, onGenerate }) {
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const generateQR = async () => {
    if (!orderData) return;
    
    setLoading(true);
    try {
      const qrData = buildQRData(orderData);
      const encoded = encodeURIComponent(qrData);
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
      setQrUrl(url);
      if (onGenerate) onGenerate(qrData);
    } catch (error) {
      console.error("Error generating QR:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildQRData = (data) => {
    const values = [
      data.color_code || "",
      data.type_item || "",
      data.batch_number || "",
      data.quantity || ""
    ];
    return values.join('|');
  };

  const printQR = () => {
    if (!qrUrl) return;
    
    const w = window.open("", "_blank", "width=400,height=500");
    if (!w) return;
    
    w.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>QR Code</title>
          <style>
            body { 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              flex-direction: column; 
              font-family: sans-serif; 
              gap: 12px; 
              direction: rtl;
              padding: 20px;
            }
            .info { text-align: center; }
            .info-row { margin: 4px 0; font-weight: bold; }
            img { border: 2px solid #333; }
          </style>
        </head>
        <body>
          <div class="info">
            <div class="info-row">رقم اللون: ${orderData?.color_code || '-'}</div>
            <div class="info-row">النوع: ${orderData?.type_item || '-'}</div>
            <div class="info-row">رقم الطبخة: ${orderData?.batch_number || '-'}</div>
            <div class="info-row">الكمية: ${orderData?.quantity || '-'}</div>
          </div>
          <img src="${qrUrl}" alt="QR Code" />
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div className="flex flex-col gap-4">
      <Button 
        onClick={generateQR} 
        disabled={loading || !orderData}
        className="w-full h-14 text-lg font-bold"
      >
        <QrCode className="w-5 h-5 ml-2" />
        {loading ? "جاري التوليد..." : "توليد QR"}
      </Button>

      {qrUrl && (
        <Card className="p-4">
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <div className="font-bold mb-2">معلومات الطلب</div>
              <div className="text-sm space-y-1">
                <div>رقم اللون: {orderData?.color_code || '-'}</div>
                <div>النوع: {orderData?.type_item || '-'}</div>
                <div>رقم الطبخة: {orderData?.batch_number || '-'}</div>
                <div>الكمية: {orderData?.quantity || '-'}</div>
              </div>
            </div>
            
            <img src={qrUrl} alt="QR Code" className="border-2 border-gray-300" />
            
            <div className="flex gap-2">
              <Button onClick={printQR} variant="outline" size="sm">
                <Printer className="w-4 h-4 ml-1" />
                طباعة
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
