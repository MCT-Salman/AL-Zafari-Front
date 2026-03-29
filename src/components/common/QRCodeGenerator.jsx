// src/components/common/QRCodeGenerator.jsx
import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { X, Download, Printer } from 'lucide-react';

export default function QRCodeGenerator({ 
  open, 
  onClose, 
  qrData, 
  title = "رمز QR",
  showInfo = true,
  colorCode = "",
  typeItem = "",
  batchNumber = "",
  quantity = ""
}) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [size] = useState(256);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (open && qrData) {
      generateQRCode();
    }
  }, [open, qrData]);

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(qrData, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const qrContent = document.getElementById('qr-print-content');
    
    if (qrContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                direction: rtl;
              }
              .qr-info { 
                margin-bottom: 20px; 
                font-size: 16px;
                line-height: 1.5;
              }
              .qr-info div { margin: 5px 0; }
              .qr-code { margin: 20px 0; }
            </style>
          </head>
          <body>
            ${qrContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div id="qr-print-content">
            {/* Order Information */}
            {showInfo && (colorCode || typeItem || batchNumber || quantity) && (
              <div className="qr-info mb-6 p-4 bg-gray-50 rounded-lg">
                {colorCode && (
                  <div className="flex justify-between">
                    <span className="font-medium">رقم اللون:</span>
                    <span>{colorCode}</span>
                  </div>
                )}
                {typeItem && (
                  <div className="flex justify-between">
                    <span className="font-medium">النوع:</span>
                    <span>{typeItem === 'Presser' ? 'كوي' : typeItem === 'Machine' ? 'مكنة' : typeItem}</span>
                  </div>
                )}
                {batchNumber && (
                  <div className="flex justify-between">
                    <span className="font-medium">رقم الطبخة:</span>
                    <span>{batchNumber}</span>
                  </div>
                )}
                {quantity && (
                  <div className="flex justify-between">
                    <span className="font-medium">الكمية:</span>
                    <span>{quantity}</span>
                  </div>
                )}
              </div>
            )}

            {/* QR Code */}
            <div className="qr-code flex justify-center mb-6">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    style={{ width: size, height: size }}
                  />
                ) : (
                  <div 
                    style={{ width: size, height: size }} 
                    className="flex items-center justify-center bg-gray-100"
                  >
                    جاري التوليد...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="h-4 w-4 ml-2" />
              تحميل
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1"
            >
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
