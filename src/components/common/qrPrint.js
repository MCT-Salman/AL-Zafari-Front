export const getQrUrl = (data) => {
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encoded}`;
};

export const printQr = (url, title = "QR", footer = "") => {
  if (!url) return;

  const win = window.open("", "_blank", "width=420,height=520");
  if (!win) return;

  win.document.write(`
    <html dir="rtl">
      <head><title>${title}</title></head>
      <body style="font-family: Tahoma, Arial, sans-serif; text-align:center; padding:16px;">
        <h3>${title}</h3>
        <img src="${url}" style="width:240px;height:240px;border:1px solid #ddd;border-radius:8px;" />
        <div style="margin-top:12px; font-size:12px; color:#444;">${footer}</div>
      </body>
    </html>
  `);

  win.document.close();
  win.focus();
  win.print();
};
