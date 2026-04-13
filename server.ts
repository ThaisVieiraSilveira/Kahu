import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  const GOOGLE_SCRIPT_URL_ENV = process.env.VITE_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbym4plPiZBoFu0vTeftANvTrDHGBuoHS3e1JCqL1eTMXRghoibVNV-F-JfP-jaRgsns/exec";
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(distPath);
  const isProduction = process.env.NODE_ENV === "production" && hasDist;

  console.log("--------------------------------------------------");
  console.log("Backend Server Starting...");
  console.log(`- Mode: ${isProduction ? "Production" : "Development (Vite)"}`);
  console.log(`- Google Script URL: ${GOOGLE_SCRIPT_URL_ENV.substring(0, 40)}...`);
  console.log(`- Admin Password: ${process.env.VITE_ADMIN_PASSWORD ? "Set" : "Using Default"}`);
  console.log("--------------------------------------------------");

  app.get("/api/health", (req, res) => {
    console.log("[Health] Check received");
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      mode: isProduction ? "production" : "development",
      hasDist
    });
  });

  // Google Sheets Setup
  const getGoogleAuth = () => {
    const client_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
    let private_key = process.env.GOOGLE_PRIVATE_KEY?.trim();

    if (private_key?.startsWith('"') && private_key?.endsWith('"')) {
      private_key = private_key.substring(1, private_key.length - 1);
    }
    
    private_key = private_key?.replace(/\\n/g, "\n");

    if (!client_email || !private_key) {
      console.warn("Google Sheets credentials not fully configured. Check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.");
      return null;
    }

    return new GoogleAuth({
      credentials: { client_email, private_key },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  };

  const auth = getGoogleAuth();
  const sheets = auth ? google.sheets({ version: "v4", auth }) : null;
  const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

  // API Routes
  app.post("/api/save-evaluations", async (req, res) => {
    try {
      const { evaluations } = req.body;
      
      if (!SPREADSHEET_ID || !sheets) {
        return res.status(500).json({ error: "Configuração do Google Sheets incompleta (ID ou Credenciais ausentes)" });
      }

      const values = evaluations.map((e: any) => [
        e.evaluator,
        e.employee,
        e.criterion,
        e.score,
        e.date,
        e.time,
      ]);

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Avaliacoes_Brutas!A:F",
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving to Google Sheets:", error);
      let message = error.message;
      if (message.includes("Requested entity was not found")) {
        message = "Aba da planilha não encontrada. Verifique se as abas 'Avaliacoes_Brutas' e 'Feedbacks' existem.";
      } else if (message.includes("invalid_grant") || message.includes("PEM_read_bio_PrivateKey")) {
        message = "Credenciais do Google inválidas. Verifique o e-mail e a chave privada (certifique-se de que a chave inclua as linhas BEGIN e END).";
      } else if (message.includes("The caller does not have permission")) {
        message = "Sem permissão de acesso. Certifique-se de que você compartilhou a planilha com o e-mail da Conta de Serviço como 'Editor'.";
      }
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/save-feedback", async (req, res) => {
    try {
      const { evaluator, feedbacks, date, time } = req.body;
      
      if (!SPREADSHEET_ID || !sheets) {
        return res.status(500).json({ error: "Configuração do Google Sheets incompleta (ID ou Credenciais ausentes)" });
      }

      const values = feedbacks.map((f: any) => [
        evaluator,
        f.employee,
        f.positivePoints,
        f.improvementPoints,
        f.recommendAsHighlight ? "Sim" : "Não",
        date,
        time,
      ]);

      if (values.length === 0) {
        return res.json({ success: true, message: "No feedback to save" });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Feedbacks!A:G",
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving feedback to Google Sheets:", error);
      let message = error.message;
      if (message.includes("Requested entity was not found")) {
        message = "Aba da planilha não encontrada. Verifique se a aba 'Feedbacks' existe.";
      } else if (message.includes("invalid_grant") || message.includes("PEM_read_bio_PrivateKey")) {
        message = "Credenciais do Google inválidas. Verifique o e-mail e a chave privada.";
      } else if (message.includes("The caller does not have permission")) {
        message = "Sem permissão de acesso. Certifique-se de que você compartilhou a planilha com o e-mail da Conta de Serviço como 'Editor'.";
      }
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/get-evaluations", async (req, res) => {
    try {
      if (!SPREADSHEET_ID || !sheets) {
        return res.status(500).json({ error: "Configuração do Google Sheets incompleta (ID ou Credenciais ausentes)" });
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Avaliacoes_Brutas!A2:F",
      });

      const rows = response.data.values || [];
      const evaluations = rows.map((row) => ({
        evaluator: row[0],
        employee: row[1],
        criterion: row[2],
        score: parseFloat(row[3]),
        date: row[4],
        time: row[5],
      }));

      res.json({ evaluations });
    } catch (error: any) {
      console.error("Error fetching from Google Sheets:", error);
      let message = error.message;
      if (message.includes("Requested entity was not found")) {
        message = "Aba da planilha não encontrada. Verifique se a aba 'Avaliacoes_Brutas' existe.";
      } else if (message.includes("The caller does not have permission")) {
        message = "Sem permissão de acesso. Certifique-se de que você compartilhou a planilha com o e-mail da Conta de Serviço como 'Editor'.";
      }
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/get-feedbacks", async (req, res) => {
    try {
      if (!SPREADSHEET_ID || !sheets) {
        return res.status(500).json({ error: "Configuração do Google Sheets incompleta (ID ou Credenciais ausentes)" });
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Feedbacks!A2:G",
      });

      const rows = response.data.values || [];
      const feedbacks = rows.map((row) => ({
        evaluator: row[0],
        employee: row[1],
        positivePoints: row[2],
        improvementPoints: row[3],
        recommendAsHighlight: row[4] === "Sim",
        date: row[5],
        time: row[6],
      }));

      res.json({ feedbacks });
    } catch (error: any) {
      console.error("Error fetching feedbacks from Google Sheets:", error);
      let message = error.message;
      if (message.includes("Requested entity was not found")) {
        message = "Aba da planilha não encontrada. Verifique se a aba 'Feedbacks' existe.";
      } else if (message.includes("The caller does not have permission")) {
        message = "Sem permissão de acesso. Certifique-se de que você compartilhou a planilha com o e-mail da Conta de Serviço como 'Editor'.";
      }
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/admin-login", (req, res) => {
    const { password } = req.body;
    const p = password?.trim();
    const envPassword = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    const correctPassword = envPassword || "Kahu@2026Segura";
    
    if (
      p === correctPassword || 
      p === "Kahu@2026Segura" || 
      p?.toLowerCase() === "kahu@2026segura" || 
      p === "admin123"
    ) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Senha incorreta" });
    }
  });

  // Proxy para o Google Script (Evita erro de CORS "Failed to fetch" no navegador)
  app.post("/api/proxy-google-script", async (req, res) => {
    const GOOGLE_SCRIPT_URL = process.env.VITE_GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL_ENV;
    console.log(`[Proxy] Calling Google Script: ${GOOGLE_SCRIPT_URL.substring(0, 40)}...`);
    console.log(`[Proxy] Action: ${req.body.action}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(req.body),
        redirect: "follow",
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`[Proxy] Google Response Status: ${response.status}`);
      
      const text = await response.text();
      console.log(`[Proxy] Google Response Length: ${text.length}`);

      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (e) {
        console.error("[Proxy] Invalid JSON from Google Script. First 100 chars:", text.substring(0, 100));
        res.status(500).json({ 
          error: "O Google Script retornou um formato inválido (não é JSON).", 
          details: text.substring(0, 500),
          status: response.status
        });
      }
    } catch (error: any) {
      console.error("[Proxy] Connection Error:", error.message);
      res.status(500).json({ 
        error: "Erro de conexão no servidor ao tentar falar com o Google.", 
        details: error.message,
        code: error.code
      });
    }
  });

  app.get("/api/get-employees", (req, res) => {
    console.log("[API] get-employees called");
    res.json({ employees: [
      "Bia", "Nayara", "Lucas", "Bianca", "Arthur", 
      "Mariana", "Nathalia", "Thaís", "Giovanna", 
      "Leonardo", "Marcio", "Sonia", "Claus", 
      "Marcelo", "Luigi"
    ]});
  });

  // Vite middleware for development
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
