import { EvaluationEntry } from "../types";

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbziQd8428QWyTkhMUtZO7t3PM-X7YZCq1wroRmHXZWoCxNB9-NgHI-WdrfBJ-Ir6MTW/exec";

console.log("API Service Initialized. Google Script URL:", GOOGLE_SCRIPT_URL ? "Defined" : "Not Defined");

export const api = {
  async saveEvaluations(evaluations: EvaluationEntry[]) {
    console.log("Attempting to save evaluations. Script URL present:", !!GOOGLE_SCRIPT_URL);
    
    // If Google Script URL is provided, send data there directly
    if (GOOGLE_SCRIPT_URL) {
      try {
        const mappedEvaluations = evaluations.map(e => ({
          avaliador: e.evaluator,
          avaliado: e.employee,
          criterio: e.criterion,
          nota: e.score,
          data: e.date,
          horario: e.time
        }));

        console.log("Sending to Google Script...");
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "saveEvaluations", evaluations: mappedEvaluations }),
        });
        
        console.log("Google Script response status:", response.status);
        return { success: true };
      } catch (error) {
        console.error("Error sending to Google Script:", error);
        throw new Error("Erro de conexão com o Google Script. Verifique se a URL está correta e se o script foi publicado como 'Qualquer pessoa'.");
      }
    }

    console.warn("VITE_GOOGLE_SCRIPT_URL not found. Falling back to local API.");
    // Fallback to local server API
    const response = await fetch("/api/save-evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evaluations }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Falha ao salvar avaliações");
    }
    return response.json();
  },

  async saveFeedback(feedback: any) {
    console.log("Attempting to save feedback. Script URL present:", !!GOOGLE_SCRIPT_URL);
    if (GOOGLE_SCRIPT_URL) {
      try {
        console.log("Sending feedback to Google Script...");
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "saveFeedback", ...feedback }),
        });
        console.log("Google Script feedback response status:", response.status);
        return { success: true };
      } catch (error) {
        console.error("Error sending feedback to Google Script:", error);
        throw new Error("Erro de conexão com o Google Script. Verifique a URL e as permissões.");
      }
    }

    console.warn("VITE_GOOGLE_SCRIPT_URL not found for feedback. Falling back to local API.");
    const response = await fetch("/api/save-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Falha ao salvar feedback");
    }
    return response.json();
  },

  async getEvaluations(): Promise<EvaluationEntry[]> {
    if (GOOGLE_SCRIPT_URL) {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "getData" }),
        });
        
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          return data.evaluations || [];
        } catch (e) {
          console.error("Failed to parse JSON from Google Script. Response text:", text);
          throw new Error("O Google Script retornou um formato inválido. Verifique se o script foi publicado corretamente.");
        }
      } catch (error: any) {
        console.error("Error fetching from Google Script:", error);
        throw error;
      }
    }

    const response = await fetch("/api/get-evaluations");
    if (!response.ok) throw new Error("Falha ao buscar avaliações");
    const data = await response.json();
    return data.evaluations;
  },

  async getFeedbacks(): Promise<any[]> {
    if (GOOGLE_SCRIPT_URL) {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "getData" }),
        });
        
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          return data.feedbacks || [];
        } catch (e) {
          console.error("Failed to parse JSON for feedbacks. Response text:", text);
          throw new Error("O Google Script retornou um formato inválido para feedbacks.");
        }
      } catch (error: any) {
        console.error("Error fetching feedbacks from Google Script:", error);
        throw error;
      }
    }

    const response = await fetch("/api/get-feedbacks");
    if (!response.ok) throw new Error("Falha ao buscar feedbacks");
    const data = await response.json();
    return data.feedbacks;
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
  }
};
