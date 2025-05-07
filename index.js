const express = require("express");
const path = require("path");
const { create } = require("@wppconnect-team/wppconnect");
require("dotenv").config();

const app = express();
let client;

// Inicializa WppConnect
create({
  session: "default",
  catchQR: (base64Qrimg, asciiQR) => {
    global.qrCodeImage = base64Qrimg;
  },
  statusFind: (statusSession, session) => {
    console.log("Status da sessão:", statusSession);
  },
  headless: true
}).then((cli) => {
  client = cli;

  // Teste direto ao grupo (opcional):
  // setTimeout(() => {
  //   client.sendText("120363416457397022@g.us", "✅ Teste direto via bot");
  // }, 10000);
});

// Middleware JSON
app.use(express.json());

// ✅ Middleware para servir HTML estático da pasta /public
app.use(express.static(path.join(__dirname, "public")));

// QR Code visual via navegador
app.get("/qr", (req, res) => {
  if (global.qrCodeImage) {
    res.send(`
      <html>
        <body>
          <h2>QR Code para conectar o WhatsApp</h2>
          <img src="${global.qrCodeImage}" />
          <script>setTimeout(() => window.location.reload(), 60000);</script>
        </body>
      </html>
    `);
  } else {
    res.send("QR Code não disponível no momento.");
  }
});

// Checa status da sessão
app.get("/status", (req, res) => {
  if (!client) return res.json({ status: "Aguardando inicialização..." });
  client.getConnectionState().then((state) => {
    res.json({ status: state });
  });
});

// ✅ Envio de mensagens para contatos e grupos
app.post("/send-message", async (req, res) => {
  try {
    const { number, message } = req.body;
    if (!client) return res.status(500).json({ error: "Cliente não conectado." });

    await client.sendText(String(number).trim(), message);

    res.json({ status: "Mensagem enviada com sucesso." });
  } catch (err) {
    console.error("[ERRO ENVIAR]", err.message);
    res.status(500).json({ error: "Erro ao enviar mensagem." });
  }
});

// Lista todos os grupos sincronizados
app.get("/listar-grupos", async (req, res) => {
  try {
    if (!client) return res.status(500).json({ error: "Cliente não conectado." });
    const grupos = await client.getAllGroups();
    res.json(grupos.map(grupo => ({
      name: grupo.name,
      id: grupo.id._serialized
    })));
  } catch (err) {
    console.error("[ERRO LISTAR GRUPOS]", err.message);
    res.status(500).json({ error: "Erro ao listar grupos." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("WppConnect server rodando na porta", PORT);
});
