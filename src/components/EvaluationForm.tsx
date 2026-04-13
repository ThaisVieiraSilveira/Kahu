import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CRITERIA, EvaluationEntry } from "../types";
import { CriterionBlock } from "./CriterionBlock";
import { api } from "../services/api";
import { Save, CheckCircle2, Loader2, UserCircle, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../lib/utils";

export const EvaluationForm: React.FC = () => {
  const [employees, setEmployees] = useState<string[]>([]);
  const [evaluator, setEvaluator] = useState("");
  const [evaluations, setEvaluations] = useState<Record<string, Record<string, number | null>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  // Feedbacks State for each employee
  const [feedbacks, setFeedbacks] = useState<Record<string, {
    positivePoints: string;
    improvementPoints: string;
    recommendAsHighlight: boolean;
  }>>({});

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const list = await api.getEmployees();
        setEmployees(list);
        
        // Initialize states
        setEvaluations(
          CRITERIA.reduce((acc, criterion) => {
            acc[criterion] = list.reduce((eAcc, employee) => {
              eAcc[employee] = null;
              return eAcc;
            }, {} as Record<string, number | null>);
            return acc;
          }, {} as Record<string, Record<string, number | null>>)
        );

        setFeedbacks(
          list.reduce((acc, name) => {
            acc[name] = {
              positivePoints: "",
              improvementPoints: "",
              recommendAsHighlight: false,
            };
            return acc;
          }, {} as Record<string, any>)
        );
      } catch (error) {
        console.error("Failed to load employees:", error);
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, []);

  const handleScoreChange = (criterion: string, employee: string, score: number) => {
    setEvaluations((prev) => ({
      ...prev,
      [criterion]: {
        ...prev[criterion],
        [employee]: score,
      },
    }));
  };

  const handleSave = async () => {
    if (!evaluator) {
      alert("Por favor, selecione quem está avaliando.");
      return;
    }

    // 1. Validate ALL employees (as requested: "não quero que ignore")
    if (employees.length === 0) {
      alert("Erro: Lista de colaboradores vazia. Aguarde o carregamento ou verifique a aba Equipe.");
      return;
    }

    const flatEvaluations: EvaluationEntry[] = [];
    const now = new Date();
    const date = format(now, "yyyy-MM-dd");
    const time = format(now, "HH:mm:ss");

    for (const employee of employees) {
      // Ensure ALL criteria are filled for EVERYONE
      for (const criterion of CRITERIA) {
        const score = evaluations[criterion][employee];
        if (score === null) {
          alert(`AVISO: Falta a nota de "${criterion}" para o colaborador "${employee}".`);
          return;
        }
        flatEvaluations.push({
          evaluator,
          employee,
          criterion: criterion as any,
          score,
          date,
          time,
        });
      }

      // Ensure qualitative feedback is filled for EVERYONE
      const f = feedbacks[employee];
      if (!f.positivePoints.trim() || !f.improvementPoints.trim()) {
        alert(`AVISO: Falta preencher os Pontos Positivos ou de Melhoria para "${employee}".`);
        return;
      }
    }

    const filledFeedbacks = employees.map(name => ({
      employee: name,
      positivePoints: feedbacks[name].positivePoints,
      improvementPoints: feedbacks[name].improvementPoints,
      recommendAsHighlight: feedbacks[name].recommendAsHighlight
    }));

    setIsSaving(true);
    try {
      // Save evaluations
      await api.saveEvaluations(flatEvaluations);

      // Save feedbacks
      await api.saveFeedback({
        evaluator,
        feedbacks: filledFeedbacks,
        date,
        time,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // Reset form
        setEvaluations(
          CRITERIA.reduce((acc, criterion) => {
            acc[criterion] = employees.reduce((eAcc, employee) => {
              eAcc[employee] = null;
              return eAcc;
            }, {} as Record<string, number | null>);
            return acc;
          }, {} as Record<string, Record<string, number | null>>)
        );
        setEvaluator("");
        setFeedbacks(
          employees.reduce((acc, name) => {
            acc[name] = {
              positivePoints: "",
              improvementPoints: "",
              recommendAsHighlight: false,
            };
            return acc;
          }, {} as Record<string, any>)
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 4000);
    } catch (error: any) {
      console.error("Save failed:", error);
      alert(`ERRO AO SALVAR:\n\n${error.message}\n\nPor favor, tente novamente. Se o erro persistir, verifique sua conexão ou se o Google Script está ativo.`);
    } finally {
      setIsSaving(false);
    }
  };

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  if (isLoadingEmployees) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-neutral-400 font-bold text-xs uppercase tracking-[0.2em]">Carregando Colaboradores...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <header className="mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-widest mb-6"
        >
          <CalendarIcon size={14} />
          {today}
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-5xl font-extrabold text-neutral-900 mb-4 tracking-tight"
        >
          Avaliação de Equipe
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-neutral-500 text-lg max-w-2xl mx-auto"
        >
          Selecione seu nome e preencha os critérios abaixo para registrar o desempenho dos colaboradores.
        </motion.p>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-b-3xl md:rounded-[2.5rem] p-4 md:p-10 mb-12 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 sticky top-0 md:top-6 z-50 shadow-xl"
      >
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
          <div className="bg-neutral-100 p-3 md:p-4 rounded-xl md:rounded-2xl text-neutral-400 shrink-0">
            <UserCircle size={24} className="md:w-8 md:h-8" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] md:text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1 md:mb-2">
              Eu sou
            </label>
            <select
              value={evaluator}
              onChange={(e) => setEvaluator(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-sm md:text-xl font-bold text-neutral-800 p-0 cursor-pointer outline-none appearance-none"
            >
              <option value="">Selecione seu nome...</option>
              {employees
                .filter(name => !name.toLowerCase().includes("tailandes"))
                .map((name) => (
                <option key={name} value={name} translate="no">
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || showSuccess}
          className={cn(
            "w-full md:w-auto flex items-center justify-center gap-3 h-14 md:h-16 px-8 md:px-12 text-sm md:text-lg min-w-0 md:min-w-[240px] rounded-xl md:rounded-2xl transition-all active:scale-95",
            "btn-primary",
            (isSaving || showSuccess) && "opacity-70 cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : showSuccess ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5 md:w-6 md:h-6" />
          )}
          {isSaving ? "Processando..." : showSuccess ? "Salvo!" : "Salvar Tudo"}
        </button>
      </motion.div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-brand-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4"
          >
            <div className="bg-brand-500 p-2 rounded-full">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="font-bold">Sucesso!</p>
              <p className="text-sm text-brand-200">As avaliações foram enviadas para o Google Sheets.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-16">
        {CRITERIA.map((criterion, idx) => (
          <CriterionBlock
            key={criterion}
            criterion={criterion}
            employees={employees}
            values={evaluations[criterion]}
            onChange={(employee, score) => handleScoreChange(criterion, employee, score)}
          />
        ))}
      </div>

      {/* Feedback Section */}
      <div className="mt-32">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-brand-600 p-4 rounded-2xl text-white shadow-lg shadow-brand-100">
            <UserCircle size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Feedback Qualitativo</h2>
            <p className="text-neutral-500 font-medium">Todos os campos são obrigatórios para os colaboradores avaliados.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {employees
            .filter(name => !name.toLowerCase().includes("tailandes"))
            .map((name) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="glass-card rounded-[2.5rem] p-10 border border-neutral-100 hover:border-brand-200 transition-all group"
            >
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="lg:w-1/4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      <UserCircle size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-neutral-800" translate="no">{name}</h3>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const isCurrentlySelected = feedbacks[name].recommendAsHighlight;
                      setFeedbacks(prev => {
                        const newFeedbacks = { ...prev };
                        // Deselect all others if selecting this one
                        if (!isCurrentlySelected) {
                          Object.keys(newFeedbacks).forEach(emp => {
                            newFeedbacks[emp] = { ...newFeedbacks[emp], recommendAsHighlight: false };
                          });
                        }
                        newFeedbacks[name] = { ...newFeedbacks[name], recommendAsHighlight: !isCurrentlySelected };
                        return newFeedbacks;
                      });
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                      feedbacks[name].recommendAsHighlight 
                        ? "bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-100" 
                        : "bg-white text-neutral-400 border-neutral-100 hover:border-brand-200"
                    )}
                  >
                    <CheckCircle2 size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Destaque da Equipe</span>
                  </button>
                  <p className="text-[10px] text-neutral-400 mt-3 font-medium text-center italic">
                    *Apenas 1 destaque por avaliação
                  </p>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-3 ml-1">
                      Pontos Positivos
                    </label>
                    <textarea
                      value={feedbacks[name].positivePoints}
                      onChange={(e) => setFeedbacks(prev => ({
                        ...prev,
                        [name]: { ...prev[name], positivePoints: e.target.value }
                      }))}
                      placeholder="O que fez de excelente?"
                      className="w-full bg-neutral-50/50 border border-neutral-100 rounded-2xl px-6 py-4 text-neutral-800 text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none placeholder:text-neutral-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-3 ml-1">
                      O que pode melhorar?
                    </label>
                    <textarea
                      value={feedbacks[name].improvementPoints}
                      onChange={(e) => setFeedbacks(prev => ({
                        ...prev,
                        [name]: { ...prev[name], improvementPoints: e.target.value }
                      }))}
                      placeholder="Pontos de desenvolvimento..."
                      className="w-full bg-neutral-50/50 border border-neutral-100 rounded-2xl px-6 py-4 text-neutral-800 text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none placeholder:text-neutral-300"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mt-20 text-center pb-20"
      >
        <button
          onClick={handleSave}
          disabled={isSaving || showSuccess}
          className="btn-primary flex items-center justify-center gap-3 mx-auto h-20 px-16 text-2xl rounded-[2rem]"
        >
          <Save size={28} />
          Finalizar e Enviar
        </button>
        <p className="text-neutral-400 mt-6 font-medium">
          Certifique-se de que todos os colaboradores foram avaliados.
        </p>
      </motion.div>
    </div>
  );
};
