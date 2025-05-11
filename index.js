const fetch = require("node-fetch");
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

  // ✅ Escuta mensagens recebidas e envia para o Gerente Comercial IA
  cli.onMessage(async (msg) => {
    try {
      if (!msg.isGroupMsg) {
        console.log("[RECEBIDO]", msg.from, msg.body);

        const payload = {
          payload: {
            user: {
              Name: msg.sender?.pushname || "Cliente",
              Phone: msg.from.replace("@c.us", "")
            },
            message: {
              text: msg.body,
              CreatedAt: new Date().toISOString()
            },
            attendant: {
              Name: "Bot"
            },
            channel: "whatsapp"
          }
        };

        console.log("[➡️ REDIRECIONANDO]", JSON.stringify(payload, null, 2));

        const response = await fetch("https://gerente-comercial-ia-production.up.railway.app/conversa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const respText = await response.text();
        console.log("[✅ RESPOSTA IA]", response.status, respText);
      }
    } catch (err) {
      console.error("[❌ ERRO NO FETCH]", err);
    }
  });
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
