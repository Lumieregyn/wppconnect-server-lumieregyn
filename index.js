const express = require("express");
const { create } = require('@wppconnect-team/wppconnect');
const app = express();
require("dotenv").config();

let client;

create({
  session: 'default',
  catchQR: (base64Qrimg, asciiQR) => {
    global.qrCodeImage = base64Qrimg;
  },
  statusFind: (statusSession, session) => {
    console.log('Status da sessão:', statusSession);
  },
  headless: true
}).then((cli) => {
  client = cli;
});

app.use(express.json());

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
  client.getConnectionState().then(state => {
    res.json({ status: state });
  });
});

app.post("/send-message", async (req, res) => {
  try {
    const { number, message } = req.body;
    if (!client) return res.status(500).json({ error: "Cliente não conectado." });
    await client.sendText(number, message);
    res.json({ status: "Mensagem enviada com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao enviar mensagem." });
  }
});

// ✅ NOVA ROTA para listar grupos conectados
app.get("/listar-grupos", async (req, res) => {
  try {
    if (!client) return res.status(500).json({ error: "Cliente não conectado." });
    const grupos = await client.getAllGroups();
    res.json(grupos.map(grupo => ({
      name: grupo.name,
      id: grupo.id
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
