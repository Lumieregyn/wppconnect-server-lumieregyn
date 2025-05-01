
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { create } = require("@wppconnect-team/wppconnect");

const app = express();
app.use(bodyParser.json());

let client;

create({
  session: "default",
  catchQR: (base64Qrimg) => {
    console.log("⚡ Escaneie o QR Code para conectar:");
  },
  statusFind: (statusSession) => {
    console.log("Status da sessão:", statusSession);
  },
  headless: true,
  devtools: false,
  useChrome: false,
  debug: false
}).then((_client) => {
  client = _client;
  console.log("✅ Cliente conectado com sucesso!");
});

app.post("/send-message", async (req, res) => {
  const { number, message } = req.body;

  if (!client) {
    return res.status(500).json({ error: "Cliente WppConnect não iniciado ainda." });
  }

  try {
    await client.sendText(number + "@c.us", message);
    res.json({ status: "Mensagem enviada com sucesso!" });
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err.message);
    res.status(500).json({ error: "Falha ao enviar a mensagem." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor WppConnect rodando na porta", PORT);
});
