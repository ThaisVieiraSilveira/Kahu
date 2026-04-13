import { EvaluationEntry } from "../types";

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbym4plPiZBoFu0vTeftANvTrDHGBuoHS3e1JCqL1eTMXRghoibVNV-F-JfP-jaRgsns/exec";

console.log("API Service Initialized.");

// Função auxiliar para chamar o proxy no servidor (evita erro de CORS no navegador)
async function callProxy(action: string, extraData: any = {}) {
  try {
    const response = await fetch("/api/proxy-google-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extraData }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Proxy Error Data]", errorData);
      const errorMessage = errorData.error || `Erro no servidor (${response.status})`;
      const errorDetails = errorData.details ? `\n\nDetalhes técnicos: ${errorData.details}` : "";
      throw new Error(errorMessage + errorDetails);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error(`Proxy call failed (${action}):`, error);
    throw error;
  }
}

export const api = {
  async saveEvaluations(evaluations: EvaluationEntry[]) {
    try {
      const mappedEvaluations = evaluations.map(e => ({
        avaliador: e.evaluator,
        avaliado: e.employee,
        criterio: e.criterion,
        nota: e.score,
        data: e.date,
        horario: e.time
      }));

      return await callProxy("saveEvaluations", { evaluations: mappedEvaluations });
    } catch (error: any) {
      console.warn("Proxy failed, falling back to local API (if configured)...", error);
      // Fallback to local server API (legacy)
      const response = await fetch("/api/save-evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluations }),
      });
      if (!response.ok) throw error;
      return response.json();
    }
  },

  async saveFeedback(feedback: any) {
    try {
      return await callProxy("saveFeedback", feedback);
    } catch (error: any) {
      console.warn("Proxy failed for feedback, falling back...", error);
      const response = await fetch("/api/save-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback),
      });
      if (!response.ok) throw error;
      return response.json();
    }
  },

  async getEvaluations(): Promise<EvaluationEntry[]> {
    try {
      const data = await callProxy("getData");
      return data.evaluations || [];
    } catch (error: any) {
      console.warn("Proxy failed for evaluations, falling back...", error);
      const response = await fetch("/api/get-evaluations");
      if (!response.ok) throw error;
      const data = await response.json();
      return data.evaluations || [];
    }
  },

  async getFeedbacks(): Promise<any[]> {
    try {
      const data = await callProxy("getData");
      return data.feedbacks || [];
    } catch (error: any) {
      console.warn("Proxy failed for feedbacks, falling back...", error);
      const response = await fetch("/api/get-feedbacks");
      if (!response.ok) throw error;
      const data = await response.json();
      return data.feedbacks || [];
    }
  },

  async getEmployees(): Promise<string[]> {
    try {
      const data = await callProxy("getEmployees");
      if (data.employees && data.employees.length > 0) {
        return data.employees;
      }
      throw new Error("No employees found in spreadsheet");
    } catch (error: any) {
      console.warn("Proxy failed for employees, falling back to local...", error);
      const response = await fetch("/api/get-employees");
      if (!response.ok) return [
        "Bia", "Nayara", "Lucas", "Bianca", "Arthur", 
        "Mariana", "Nathalia", "Thaís", "Giovanna", 
        "Leonardo", "Marcio", "Sonia", "Claus", 
        "Marcelo", "Luigi"
      ];
      const data = await response.json();
      return data.employees || [];
    }
  },

  async adminLogin(password: string) {
    // No Netlify (ambiente estático), validamos a senha diretamente no frontend
    const p = password.trim();
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    const fallbackPassword = "Kahu@2026Segura";
    
    // Verificação robusta: exata, fallback fixo, minúscula (caso o usuário erre o Shift) e padrão antigo
    if (
      p === envPassword || 
      p === fallbackPassword || 
      p === "Kahu@2026Segura" || 
      p.toLowerCase() === "kahu@2026segura" || 
      p === "admin123"
    ) {
      return { success: true };
    } else {
      throw new Error("Senha incorreta");
    }
  },

  async callProxy(action: string, extraData: any = {}) {
    return await callProxy(action, extraData);
  }
};
