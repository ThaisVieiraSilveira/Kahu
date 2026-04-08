import React, { useState } from "react";
import { motion } from "motion/react";
import { Lock, Loader2 } from "lucide-react";
import { api } from "../services/api";

interface AdminLoginProps {
  onLogin: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await api.adminLogin(password);
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 rounded-3xl w-full max-w-md text-center"
      >
        <div className="bg-brand-100 w-16 h-16 rounded-2xl flex items-center justify-center text-brand-600 mx-auto mb-6">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Área Administrativa</h2>
        <p className="text-neutral-500 mb-8">Acesso restrito para responsáveis</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 ml-1">
              Senha de Acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full h-12 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Entrar no Painel"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
