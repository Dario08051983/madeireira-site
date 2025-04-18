require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const { BlobServiceClient } = require("@azure/storage-blob");

const app = express();
const PORT = process.env.PORT || 3000;

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "xml-agendamentos";

app.use(express.static("public"));
app.use(express.json());

// Rota para receber agendamento
app.post("/agendar", async (req, res) => {
  const { cliente, servico, data } = req.body;

  const xml = `
<agendamento>
  <cliente>${cliente}</cliente>
  <servico>${servico}</servico>
  <data>${data}</data>
</agendamento>`.trim();

  const fileName = `agendamento-${Date.now()}.xml`;
  const filePath = path.join(__dirname, "xml", fileName);

  fs.writeFileSync(filePath, xml);

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.uploadFile(filePath);
    console.log(`✅ XML enviado: ${fileName}`);
    res.send("Agendamento salvo e enviado com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao enviar XML:", err.message);
    res.status(500).send("Erro ao enviar XML");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Rodando em http://localhost:${PORT}`);
});
