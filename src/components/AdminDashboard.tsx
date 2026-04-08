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
  const [activeTab, setActiveTab] = useState<"stats" | "feedbacks">("stats");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterEvaluator, setFilterEvaluator] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [evaluations, feedbackData] = await Promise.all([
        api.getEvaluations(),
        api.getFeedbacks()
      ]);
      setData(evaluations);
      setFeedbacks(feedbackData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
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

  const stats = useMemo(() => {
    const employeeTotals: Record<string, { sum: number; count: number }> = {};
    const criterionTotals: Record<string, { sum: number; count: number }> = {};

    filteredData.forEach(e => {
      if (!employeeTotals[e.employee]) employeeTotals[e.employee] = { sum: 0, count: 0 };
      employeeTotals[e.employee].sum += e.score;
      employeeTotals[e.employee].count += 1;

      if (!criterionTotals[e.criterion]) criterionTotals[e.criterion] = { sum: 0, count: 0 };
      criterionTotals[e.criterion].sum += e.score;
      criterionTotals[e.criterion].count += 1;
    });

    const employeeAverages = Object.entries(employeeTotals).map(([name, { sum, count }]) => ({
      name,
      average: parseFloat((sum / count).toFixed(1)),
    })).sort((a, b) => b.average - a.average);

    const criterionAverages = Object.entries(criterionTotals).map(([name, { sum, count }]) => ({
      name,
      average: parseFloat((sum / count).toFixed(1)),
    }));

    return { employeeAverages, criterionAverages };
  }, [filteredData]);

  const COLORS = ["#65a30d", "#84cc16", "#a3e635", "#bef264", "#d9f99d", "#ecfccb"];

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
          <button className="btn-primary flex items-center gap-3 h-14 px-8">
            <Download size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Exportar Relatório</span>
          </button>
        </div>
      </header>

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
                {(stats.employeeAverages.reduce((acc, curr) => acc + curr.average, 0) / (stats.employeeAverages.length || 1)).toFixed(1)}
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
            <h3 className="text-5xl font-black text-neutral-900">{filteredData.length}</h3>
            <p className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest mt-4">Total de Avaliações</p>
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
              {EMPLOYEES.map(name => <option key={name} value={name}>{name}</option>)}
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
                          <span className="text-sm font-bold text-neutral-700">{format(parseISO(e.date), "dd MMM, yyyy", { locale: ptBR })}</span>
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
      ) : (
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
                    {format(parseISO(f.date), "dd MMM, yyyy", { locale: ptBR })}
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
      )}
    </div>
  );
};
