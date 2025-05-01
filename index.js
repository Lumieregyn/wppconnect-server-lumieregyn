const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { create } = require('@wppconnect-team/wppconnect');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

let qrCodeBase64 = '[QR Code Aqui]';

create({
  session: 'default',
  catchQR: (base64Qr) => {
    qrCodeBase64 = base64Qr;
    io.emit("qr", base64Qr);
    console.log("QR Code atualizado.");
  },
  statusFind: (statusSession, session) => {
    console.log("Status da sessão:", statusSession);
  },
  headless: true,
  devtools: false,
  useChrome: true,
  browserArgs: [''],
}).then((client) => {
  io.emit("ready", "Cliente conectado.");
  client.onMessage((message) => {
    console.log("Mensagem recebida:", message.body);
    io.emit("mensagem", message.body);
  });
});

app.get("/qr", (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Escaneie o QR Code abaixo:</h1>
        <img src="${qrCodeBase64}" width="300"/>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
