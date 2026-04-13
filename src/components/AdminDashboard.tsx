import React, { useEffect, useState, useMemo } from "react";
import { motion } from "motion/react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from "recharts";
import { EvaluationEntry, EMPLOYEES, CRITERIA } from "../types";
import { api } from "../services/api";
import { 
  Users, Star, TrendingUp, Calendar, Filter, 
  Download, RefreshCw, ChevronRight, Search,
  Activity, ArrowUpRight, ArrowDownRight,
  PieChart as PieChartIcon, BarChart3, UserCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../lib/utils";

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<EvaluationEntry[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "feedbacks" | "employees">("stats");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterEvaluator, setFilterEvaluator] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticLog, setDiagnosticLog] = useState<string[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [isSavingEmployees, setIsSavingEmployees] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [evaluations, feedbackData, employeeList] = await Promise.all([
        api.getEvaluations(),
        api.getFeedbacks(),
        api.getEmployees()
      ]);
      setData(evaluations);
      setFeedbacks(feedbackData);
      setEmployees(employeeList);
    } catch (error: any) {
      console.error(error);
      setFetchError(error.message || "Erro desconhecido ao buscar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmployees = async (updatedList: string[]) => {
    setIsSavingEmployees(true);
    try {
      await api.callProxy("saveEmployees", { employees: updatedList });
      setEmployees(updatedList);
      alert("Lista de colaboradores atualizada com sucesso!");
    } catch (error: any) {
      alert("Erro ao salvar colaboradores: " + error.message);
    } finally {
      setIsSavingEmployees(false);
    }
  };

  const runDiagnostic = async () => {
    setShowDiagnostic(true);
    setDiagnosticLog([]);
    const log = (msg: string) => setDiagnosticLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    
    log("Iniciando diagnóstico do sistema...");
    try {
      log("1. Testando conexão com o servidor local (/api/health)...");
      const healthRes = await fetch("/api/health").catch(e => ({ ok: false, statusText: e.message }));
      if (healthRes.ok) {
        const healthData = await (healthRes as Response).json();
        log(`✅ Servidor OK: ${JSON.stringify(healthData)}`);
      } else {
        log(`❌ Erro no servidor local: ${(healthRes as any).statusText || (healthRes as any).status}`);
        log("DICA: Verifique se o servidor backend está rodando.");
      }
      
      log("2. Testando Proxy do Google Script (/api/proxy-google-script)...");
      const proxyRes = await fetch("/api/proxy-google-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getData" })
      }).catch(e => ({ ok: false, statusText: e.message }));
      
      if (proxyRes.ok) {
        log("✅ Proxy respondeu!");
        const data = await (proxyRes as Response).json();
        if (data.evaluations || data.feedbacks) {
          log(`✅ Dados recebidos com sucesso! (${data.evaluations?.length || 0} avaliações)`);
        } else {
          log("⚠️ Proxy respondeu, mas os dados vieram vazios ou em formato inesperado.");
          log(`Resposta: ${JSON.stringify(data).substring(0, 100)}...`);
        }
      } else {
        const err = await (proxyRes as Response).json().catch(() => ({ error: "Erro desconhecido no Proxy" }));
        log(`❌ Erro no Proxy: ${err.error || (proxyRes as any).statusText}`);
        if (err.details) {
          log(`DETALHES DO GOOGLE: ${err.details.substring(0, 200)}...`);
          if (err.details.includes("<!DOCTYPE html>")) {
            log("DICA: O Google retornou uma página HTML em vez de dados. Isso geralmente significa que o Script não foi publicado como 'Qualquer pessoa' ou a URL está errada.");
          }
        }
      }
    } catch (e: any) {
      log(`💥 Falha crítica no diagnóstico: ${e.message}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(e => {
      const matchEmployee = !filterEmployee || e.employee === filterEmployee;
      const matchEvaluator = !filterEvaluator || e.evaluator === filterEvaluator;
      const matchDate = !filterDate || e.date === filterDate;
      const matchSearch = !searchTerm || 
        e.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.evaluator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.criterion.toLowerCase().includes(searchTerm.toLowerCase());
      return matchEmployee && matchEvaluator && matchDate && matchSearch;
    });
  }, [data, filterEmployee, filterEvaluator, filterDate, searchTerm]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const matchEmployee = !filterEmployee || f.employee === filterEmployee;
      const matchDate = !filterDate || f.date === filterDate;
      const matchSearch = !searchTerm || 
        f.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.evaluator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.positivePoints.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.improvementPoints.toLowerCase().includes(searchTerm.toLowerCase());
      return matchEmployee && matchDate && matchSearch;
    });
  }, [feedbacks, filterEmployee, filterDate, searchTerm]);

  const safeParseDate = (dateStr: string) => {
    try {
      if (!dateStr) return new Date();
      // Try ISO first
      const date = parseISO(dateStr);
      if (!isNaN(date.getTime())) return date;
      
      // Try common formats like DD/MM/YYYY
      const parts = dateStr.split(/[/-]/);
      if (parts.length === 3) {
        // Assume DD/MM/YYYY or YYYY/MM/DD
        if (parts[0].length === 4) {
          return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      }
      return new Date(dateStr);
    } catch (e) {
      return new Date();
    }
  };

  const dynamicEmployees = useMemo(() => {
    const names = new Set<string>();
    data.forEach(e => names.add(e.employee));
    feedbacks.forEach(f => names.add(f.employee));
    // Add default employees if they exist in data or just use the set
    return Array.from(names).sort();
  }, [data, feedbacks]);

  const stats = useMemo(() => {
    const employeeTotals: Record<string, { sum: number; count: number }> = {};
    const criterionTotals: Record<string, { sum: number; count: number }> = {};

    filteredData.forEach(e => {
      const score = Number(e.score) || 0;
      if (!employeeTotals[e.employee]) employeeTotals[e.employee] = { sum: 0, count: 0 };
      employeeTotals[e.employee].sum += score;
      employeeTotals[e.employee].count += 1;

      if (!criterionTotals[e.criterion]) criterionTotals[e.criterion] = { sum: 0, count: 0 };
      criterionTotals[e.criterion].sum += score;
      criterionTotals[e.criterion].count += 1;
    });

    const employeeAverages = Object.entries(employeeTotals).map(([name, { sum, count }]) => ({
      name,
      average: count > 0 ? parseFloat((sum / count).toFixed(1)) : 0,
    })).sort((a, b) => b.average - a.average);

    const criterionAverages = Object.entries(criterionTotals).map(([name, { sum, count }]) => ({
      name,
      average: count > 0 ? parseFloat((sum / count).toFixed(1)) : 0,
    }));

    const overallAverage = employeeAverages.length > 0 
      ? (employeeAverages.reduce((acc, curr) => acc + curr.average, 0) / employeeAverages.length).toFixed(1)
      : "0.0";

    return { employeeAverages, criterionAverages, overallAverage };
  }, [filteredData]);

  const COLORS = ["#65a30d", "#84cc16", "#a3e635", "#bef264", "#d9f99d", "#ecfccb"];

  const exportToCSV = () => {
    if (data.length === 0 && feedbacks.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    // Export Evaluations
    let csvContent = "TIPO;DATA;HORARIO;AVALIADOR;COLABORADOR;CRITERIO/PONTOS POSITIVOS;NOTA/PONTOS MELHORIA\n";

    // Add Evaluations
    data.forEach(e => {
      const row = [
        "AVALIAÇÃO",
        e.date,
        e.time,
        `"${e.evaluator}"`,
        `"${e.employee}"`,
        `"${e.criterion}"`,
        e.score
      ].join(";");
      csvContent += row + "\n";
    });

    // Add Feedbacks
    feedbacks.forEach(f => {
      const row = [
        "FEEDBACK",
        f.date,
        f.time,
        `"${f.evaluator}"`,
        `"${f.employee}"`,
        `"Positivos: ${f.positivePoints?.replace(/"/g, '""')}"`,
        `"Melhoria: ${f.improvementPoints?.replace(/"/g, '""')}"`
      ].join(";");
      csvContent += row + "\n";
    });

    // Create blob and download with BOM for Excel
    const BOM = "\ufeff";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_completo_kahu_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-neutral-400 font-bold text-xs uppercase tracking-[0.2em]">Carregando Dados...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-600 font-black text-[10px] uppercase tracking-[0.3em]">
            <Activity size={14} />
            Real-time Analytics
          </div>
          <h1 className="text-5xl font-black text-neutral-900 tracking-tight">Painel de Gestão</h1>
          <p className="text-neutral-500 text-lg">Monitore o desempenho da sua equipe em tempo real.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchData} 
            className="w-14 h-14 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-brand-600 hover:border-brand-100 hover:bg-brand-50/50 transition-all shadow-sm"
            title="Atualizar Dados"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={exportToCSV}
            className="btn-primary flex items-center gap-3 h-14 px-8"
          >
            <Download size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Exportar Relatório</span>
          </button>
        </div>
      </header>

      {fetchError && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl mb-12">
          <div className="flex items-center gap-4 mb-4">
            <Activity size={24} />
            <div className="flex-1">
              <p className="font-bold">Erro ao carregar dados:</p>
              <p className="text-sm font-mono bg-white/50 p-2 rounded mt-1">{fetchError}</p>
            </div>
          </div>
          
          <div className="bg-white/50 p-4 rounded-2xl border border-red-100/50 mb-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-70">Possíveis Soluções:</p>
            <ul className="text-xs space-y-2 opacity-80 list-disc pl-4">
              <li>Verifique se o Google Script foi publicado como <strong>"Qualquer pessoa" (Anyone)</strong>.</li>
              <li>Certifique-se de que você clicou em <strong>"Nova Versão"</strong> ao atualizar o script no Google.</li>
              <li>O erro "Failed to fetch" no proxy indica que o servidor não conseguiu falar com o Google.</li>
            </ul>
          </div>

          <button 
            onClick={runDiagnostic}
            className="w-full py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Activity size={14} />
            Executar Diagnóstico Completo
          </button>
        </div>
      )}

      {showDiagnostic && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h3 className="font-black text-xl text-neutral-900">Diagnóstico do Sistema</h3>
              <button 
                onClick={() => setShowDiagnostic(false)}
                className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
              >
                <RefreshCw size={20} />
              </button>
            </div>
            <div className="p-6 bg-neutral-900 font-mono text-xs text-green-400 h-96 overflow-y-auto space-y-1">
              {diagnosticLog.map((line, i) => (
                <div key={i} className={line.includes("❌") ? "text-red-400" : line.includes("⚠️") ? "text-yellow-400" : ""}>
                  {line}
                </div>
              ))}
              {diagnosticLog.length === 0 && <div className="animate-pulse">Aguardando início...</div>}
            </div>
            <div className="p-6 border-t border-neutral-100 flex justify-end gap-4">
              <button 
                onClick={() => setShowDiagnostic(false)}
                className="px-6 py-2 text-sm font-bold text-neutral-500 hover:text-neutral-900"
              >
                Fechar
              </button>
              <button 
                onClick={runDiagnostic}
                className="px-6 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700"
              >
                Reiniciar Teste
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-neutral-100 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-[5rem] -mr-10 -mt-10 transition-all group-hover:scale-110" />
          <div className="relative z-10">
            <div className="bg-brand-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-brand-100">
              <Star size={24} />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-5xl font-black text-neutral-900">
                {stats.overallAverage}
              </h3>
              <span className="text-brand-600 font-bold text-sm">/ 10</span>
            </div>
            <p className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest mt-4">Média Geral da Equipe</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-neutral-100 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[5rem] -mr-10 -mt-10 transition-all group-hover:scale-110" />
          <div className="relative z-10">
            <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-blue-100">
              <Users size={24} />
            </div>
            <div className="flex items-baseline gap-4">
              <div>
                <h3 className="text-5xl font-black text-neutral-900">{filteredData.length}</h3>
                <p className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest mt-2">Avaliações</p>
              </div>
              <div className="w-px h-12 bg-neutral-100" />
              <div>
                <h3 className="text-5xl font-black text-neutral-900">{filteredFeedbacks.length}</h3>
                <p className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest mt-2">Feedbacks</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-neutral-100 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[5rem] -mr-10 -mt-10 transition-all group-hover:scale-110" />
          <div className="relative z-10">
            <div className="bg-orange-500 w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-orange-100">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-3xl font-black text-neutral-900 truncate pr-4">
              {stats.employeeAverages[0]?.name || "-"}
            </h3>
            <p className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest mt-4">Top Performer</p>
          </div>
        </motion.div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-[2.5rem] p-10 mb-16 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-neutral-100">
        <div className="flex flex-col lg:flex-row gap-8 items-center mb-8">
          <div className="flex bg-neutral-100 p-1.5 rounded-2xl w-full lg:w-auto">
            <button
              onClick={() => setActiveTab("stats")}
              className={cn(
                "flex-1 lg:flex-none px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === "stats" ? "bg-white text-brand-700 shadow-sm" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              Estatísticas
            </button>
            <button
              onClick={() => setActiveTab("feedbacks")}
              className={cn(
                "flex-1 lg:flex-none px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === "feedbacks" ? "bg-white text-brand-700 shadow-sm" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              Feedbacks
            </button>
            <button
              onClick={() => setActiveTab("employees")}
              className={cn(
                "flex-1 lg:flex-none px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === "employees" ? "bg-white text-brand-700 shadow-sm" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              Equipe
            </button>
          </div>
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input 
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-50 border-none rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-brand-500 font-medium transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 bg-neutral-50 px-4 py-2 rounded-2xl border border-neutral-100">
            <Users size={16} className="text-neutral-400" />
            <select 
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-neutral-600 cursor-pointer"
            >
              <option value="">Colaborador</option>
              {dynamicEmployees.map(name => <option key={name} value={name}>{name}</option>)}
              {dynamicEmployees.length === 0 && EMPLOYEES.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 bg-neutral-50 px-4 py-2 rounded-2xl border border-neutral-100">
            <Calendar size={16} className="text-neutral-400" />
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-neutral-600 cursor-pointer"
            />
          </div>
          <button 
            onClick={() => { setFilterEmployee(""); setFilterEvaluator(""); setFilterDate(""); setSearchTerm(""); }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Limpar Filtros"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {activeTab === "stats" ? (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-neutral-100">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black text-neutral-900 tracking-tight">Médias por Colaborador</h3>
                <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-400">
                  <BarChart3 size={16} />
                </div>
              </div>
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.employeeAverages} layout="vertical" margin={{ left: 20, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f5" />
                    <XAxis type="number" domain={[0, 10]} hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      width={100} 
                      tick={{ fontSize: 12, fontWeight: 700, fill: '#404040' }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#fafafa' }}
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    />
                    <Bar dataKey="average" radius={[0, 12, 12, 0]} barSize={24}>
                      {stats.employeeAverages.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-neutral-100">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black text-neutral-900 tracking-tight">Médias por Critério</h3>
                <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-400">
                  <PieChartIcon size={16} />
                </div>
              </div>
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.criterionAverages}
                      cx="50%"
                      cy="50%"
                      innerRadius={100}
                      outerRadius={150}
                      paddingAngle={8}
                      dataKey="average"
                      stroke="none"
                    >
                      {stats.criterionAverages.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-2">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-neutral-100 overflow-hidden">
            <div className="px-10 py-8 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/30">
              <div>
                <h3 className="text-xl font-black text-neutral-900 tracking-tight">Histórico de Registros</h3>
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-1">Últimas 50 avaliações</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-brand-600 bg-brand-50 px-4 py-2 rounded-xl border border-brand-100">
                  {filteredData.length} REGISTROS
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white">
                    <th className="px-10 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Data & Hora</th>
                    <th className="px-10 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Avaliador</th>
                    <th className="px-10 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Colaborador</th>
                    <th className="px-10 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Critério</th>
                    <th className="px-10 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] text-center">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filteredData.slice(0, 50).map((e, i) => (
                    <tr key={i} className="group hover:bg-neutral-50/50 transition-all duration-300">
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-neutral-700">{format(safeParseDate(e.date), "dd MMM, yyyy", { locale: ptBR })}</span>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{e.time}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 text-[10px] font-bold">
                            {e.evaluator.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-neutral-700">{e.evaluator}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-sm font-bold text-neutral-900">{e.employee}</span>
                      </td>
                      <td className="px-10 py-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-neutral-100 text-neutral-500 text-[10px] font-black uppercase tracking-widest">
                          {e.criterion}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm shadow-sm",
                          e.score >= 8 ? "bg-brand-600 text-white" : 
                          e.score >= 5 ? "bg-orange-500 text-white" : 
                          "bg-red-500 text-white"
                        )}>
                          {e.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length > 50 && (
              <div className="px-10 py-6 bg-neutral-50/50 text-center border-t border-neutral-100">
                <button className="text-brand-600 font-bold text-xs uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto">
                  Ver Histórico Completo <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </>
      ) : activeTab === "feedbacks" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredFeedbacks.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-neutral-100 flex flex-col gap-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-neutral-900">{f.employee}</h4>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Avaliado por {f.evaluator}</p>
                  </div>
                </div>
                {f.recommendAsHighlight && (
                  <div className="bg-brand-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand-100">
                    <Star size={12} />
                    Destaque
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-2">Pontos Positivos</p>
                  <p className="text-neutral-600 text-sm leading-relaxed bg-neutral-50 p-4 rounded-2xl border border-neutral-100 italic">
                    "{f.positivePoints || "Nenhum comentário registrado."}"
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">O que pode melhorar</p>
                  <p className="text-neutral-600 text-sm leading-relaxed bg-neutral-50 p-4 rounded-2xl border border-neutral-100 italic">
                    "{f.improvementPoints || "Nenhum comentário registrado."}"
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-neutral-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-400">
                  <Calendar size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {format(safeParseDate(f.date), "dd MMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">{f.time}</span>
              </div>
            </motion.div>
          ))}
          {filteredFeedbacks.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-neutral-400 font-bold text-sm uppercase tracking-widest">Nenhum feedback encontrado.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="glass-card rounded-[2.5rem] p-10">
            <h3 className="text-2xl font-black text-neutral-900 mb-6">Gerenciar Colaboradores</h3>
            <p className="text-neutral-500 mb-8">Adicione ou remova os nomes que aparecem no formulário de avaliação.</p>
            
            <div className="flex gap-4 mb-10">
              <input 
                type="text"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                placeholder="Nome do novo colaborador..."
                className="flex-1 bg-neutral-50 border border-neutral-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                onKeyPress={(e) => e.key === 'Enter' && newEmployeeName.trim() && handleSaveEmployees([...employees, newEmployeeName.trim()])}
              />
              <button 
                onClick={() => {
                  if (newEmployeeName.trim()) {
                    handleSaveEmployees([...employees, newEmployeeName.trim()]);
                    setNewEmployeeName("");
                  }
                }}
                disabled={isSavingEmployees || !newEmployeeName.trim()}
                className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-brand-700 transition-all disabled:opacity-50"
              >
                {isSavingEmployees ? "Salvando..." : "Adicionar"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((name, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 group hover:border-brand-200 transition-all">
                  <span className="font-bold text-neutral-700">{name}</span>
                  <button 
                    onClick={() => {
                      if (confirm(`Deseja remover ${name} da lista?`)) {
                        handleSaveEmployees(employees.filter(e => e !== name));
                      }
                    }}
                    className="p-2 text-neutral-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <RefreshCw size={16} className="rotate-45" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
