import { EvaluationEntry } from "../types";

export const api = {
  async saveEvaluations(evaluations: EvaluationEntry[]) {
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
    const response = await fetch("/api/get-evaluations");
    if (!response.ok) throw new Error("Falha ao buscar avaliações");
    const data = await response.json();
    return data.evaluations;
  },

  async getFeedbacks(): Promise<any[]> {
    const response = await fetch("/api/get-feedbacks");
    if (!response.ok) throw new Error("Falha ao buscar feedbacks");
    const data = await response.json();
    return data.feedbacks;
  },

  async adminLogin(password: string) {
    const response = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) throw new Error("Senha incorreta");
    return response.json();
  }
};
