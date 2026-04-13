import React, { useState } from "react";
import { EvaluationForm } from "./components/EvaluationForm";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminLogin } from "./components/AdminLogin";
import { LayoutDashboard, ClipboardList, LogOut, Dog, UserCircle } from "lucide-react";
import { cn } from "./lib/utils";

type View = "evaluation" | "admin";

export default function App() {
  const [view, setView] = useState<View>("evaluation");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex flex-col select-none">
            <h1 className="text-2xl font-black bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-600 bg-clip-text text-transparent tracking-tighter leading-none">
              KAHU
            </h1>
            <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] mt-1.5 opacity-80">
              Lar do seu PET
            </p>
          </div>

          <div className="flex items-center bg-neutral-100/50 p-1.5 rounded-[1.25rem] border border-neutral-100">
            <button
              onClick={() => setView("evaluation")}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300",
                view === "evaluation" 
                  ? "bg-white text-brand-700 shadow-sm" 
                  : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              <ClipboardList size={16} />
              Avaliação
            </button>
            <button
              onClick={() => setView("admin")}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300",
                view === "admin" 
                  ? "bg-white text-brand-700 shadow-sm" 
                  : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              <LayoutDashboard size={16} />
              Admin
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {view === "admin" && isAdminAuthenticated && (
              <button 
                onClick={() => setIsAdminAuthenticated(false)}
                className="w-10 h-10 rounded-xl border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Sair do Admin"
              >
                <LogOut size={18} />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center">
              <UserCircle size={20} className="text-neutral-400" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {view === "evaluation" ? (
          <EvaluationForm />
        ) : (
          <>
            {isAdminAuthenticated ? (
              <AdminDashboard />
            ) : (
              <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-neutral-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} KAHU - Sistema Interno de Avaliação • v1.0.6
          </p>
        </div>
      </footer>
    </div>
  );
}

