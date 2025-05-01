// index.js restaurado conforme versão original estável
const express = require("express");
const { create } = require("@wppconnect-team/wppconnect");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let qrCodeImage = "";

create({
  session: 'default',
  catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
    qrCodeImage = base64Qr;
    console.log("QR Code recebido");
  },
  statusFind: (statusSession, session) => {
    console.log(`Status da sessão: ${statusSession}`);
  },
  headless: true,
  devtools: false,
  useChrome: true,
  browserArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu'
  ]
}).then(client => {
  app.get("/qr", (req, res) => {
    if (!qrCodeImage) return res.send("<h1>QR Code ainda não gerado</h1>");
    res.send(`
      <html>
        <body>
          <h1>Escaneie o QR Code abaixo:</h1>
          <img src="${qrCodeImage}" width="300" />
        </body>
      </html>
    `);
  });

  app.get("/", (req, res) => {
    res.send("Servidor do WppConnect está online!");
  });

  app.listen(PORT, () => {
    console.log("Servidor do WppConnect rodando na porta", PORT);
  });

}).catch(err => console.error("Erro ao iniciar o WppConnect:", err));
