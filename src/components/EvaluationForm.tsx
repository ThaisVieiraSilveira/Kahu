import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CRITERIA, EMPLOYEES, EvaluationEntry } from "../types";
import { CriterionBlock } from "./CriterionBlock";
import { api } from "../services/api";
import { Save, CheckCircle2, Loader2, UserCircle, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../lib/utils";

export const EvaluationForm: React.FC = () => {
  const [evaluator, setEvaluator] = useState("");
  const [evaluations, setEvaluations] = useState<Record<string, Record<string, number | null>>>(
    CRITERIA.reduce((acc, criterion) => {
      acc[criterion] = EMPLOYEES.reduce((eAcc, employee) => {
        eAcc[employee] = null;
        return eAcc;
      }, {} as Record<string, number | null>);
      return acc;
    }, {} as Record<string, Record<string, number | null>>)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Feedbacks State for each employee
  const [feedbacks, setFeedbacks] = useState<Record<string, {
    positivePoints: string;
    improvementPoints: string;
    recommendAsHighlight: boolean;
  }>>(
    EMPLOYEES.reduce((acc, name) => {
      acc[name] = {
        positivePoints: "",
        improvementPoints: "",
        recommendAsHighlight: false,
      };
      return acc;
    }, {} as Record<string, any>)
  );

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

    const flatEvaluations: EvaluationEntry[] = [];
    const now = new Date();
    const date = format(now, "yyyy-MM-dd");
    const time = format(now, "HH:mm:ss");

    for (const criterion of CRITERIA) {
      for (const employee of EMPLOYEES) {
        const score = evaluations[criterion][employee];
        if (score !== null) {
          flatEvaluations.push({
            evaluator,
            employee,
            criterion: criterion as any,
            score,
            date,
            time,
          });
        }
      }
    }

    if (flatEvaluations.length === 0) {
      alert("Por favor, preencha pelo menos uma avaliação.");
      return;
    }

    setIsSaving(true);
    try {
      // Save evaluations
      await api.saveEvaluations(flatEvaluations);

      // Save feedbacks if filled
      const filledFeedbacks = EMPLOYEES
        .map(name => ({ name, f: feedbacks[name] }))
        .filter(({ f }) => f.positivePoints || f.improvementPoints || f.recommendAsHighlight)
        .map(({ name, f }) => ({
          employee: name,
          positivePoints: f.positivePoints,
          improvementPoints: f.improvementPoints,
          recommendAsHighlight: f.recommendAsHighlight
        }));

      if (filledFeedbacks.length > 0) {
        await api.saveFeedback({
          evaluator,
          feedbacks: filledFeedbacks,
          date,
          time,
        });
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // Reset form
        setEvaluations(
          CRITERIA.reduce((acc, criterion) => {
            acc[criterion] = EMPLOYEES.reduce((eAcc, employee) => {
              eAcc[employee] = null;
              return eAcc;
            }, {} as Record<string, number | null>);
            return acc;
          }, {} as Record<string, Record<string, number | null>>)
        );
        setEvaluator("");
        setFeedbacks(
          EMPLOYEES.reduce((acc, name) => {
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
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar avaliações. Verifique a conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

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
        className="glass-card rounded-[2.5rem] p-10 mb-16 flex flex-col md:flex-row items-center justify-between gap-8 sticky top-6 z-50"
      >
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="bg-neutral-100 p-4 rounded-2xl text-neutral-400">
            <UserCircle size={32} />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
              Quem está avaliando?
            </label>
            <select
              value={evaluator}
              onChange={(e) => setEvaluator(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-xl font-bold text-neutral-800 p-0 cursor-pointer outline-none appearance-none"
            >
              <option value="">Selecione seu nome...</option>
              {EMPLOYEES.map((name) => (
                <option key={name} value={name}>
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
            "btn-primary w-full md:w-auto flex items-center justify-center gap-3 h-16 px-12 text-lg min-w-[240px]",
            (isSaving || showSuccess) && "opacity-70 cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <Loader2 className="animate-spin" />
          ) : showSuccess ? (
            <CheckCircle2 />
          ) : (
            <Save size={22} />
          )}
          {isSaving ? "Processando..." : showSuccess ? "Avaliação Salva!" : "Salvar Tudo"}
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
            <p className="text-neutral-500 font-medium">Deixe comentários detalhados para cada colaborador (opcional)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {EMPLOYEES.map((name) => (
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
                    <h3 className="text-2xl font-black text-neutral-800">{name}</h3>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setFeedbacks(prev => ({
                      ...prev,
                      [name]: { ...prev[name], recommendAsHighlight: !prev[name].recommendAsHighlight }
                    }))}
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
