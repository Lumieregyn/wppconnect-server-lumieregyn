const express = require("express");
const path = require("path");
const { create } = require("@wppconnect-team/wppconnect");
require("dotenv").config();

const app = express();
let client;

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

  // Teste direto opcional (remova depois de validar)
  // setTimeout(() => {
  //   client.sendText("120363416457397022@g.us", "🚀 Teste direto do bot após conexão");
  // }, 10000);
});

app.use(express.json());

// ✅ Serve o painel HTML (público)
app.use(express.static(path.join(__dirname, "public")));

app.get("/qr", (req, res) => {
  if (global.qrCodeImage) {
    res.send(`
      <html>
        <body>
          <h2>QR Code para conectar o WhatsApp</h2>
          <img src="${global.qrCodeImage}" />
          <script>
            setTimeout(() => window.location.reload(), 60000);
          </script>
        </body>
      </html>
    `);
  } else {
    res.send("QR Code não disponível no momento.");
  }
});

app.get("/status", (req, res) => {
  if (!client) return res.json({ status: "Aguardando inicialização..." });
  client.getConnectionState().then((state) => {
    res.json({ status: state });
  });
});

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
