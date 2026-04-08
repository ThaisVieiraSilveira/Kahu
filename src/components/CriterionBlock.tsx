import React from "react";
import { motion } from "motion/react";
import { Criterion, EMPLOYEES, SCORES } from "../types";
import { cn } from "../lib/utils";

interface CriterionBlockProps {
  criterion: Criterion;
  values: Record<string, number | null>;
  onChange: (employee: string, score: number) => void;
}

export const CriterionBlock: React.FC<CriterionBlockProps> = ({
  criterion,
  values,
  onChange,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-neutral-100 overflow-hidden mb-12"
    >
      <div className="bg-neutral-50/50 px-8 py-6 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="text-xl font-bold text-neutral-800 tracking-tight">{criterion}</h3>
        <div className="flex gap-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Escala: 0-10</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white">
              <th className="pl-8 pr-4 py-5 text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] w-1/3">
                Colaborador
              </th>
              {SCORES.map((score) => (
                <th
                  key={score}
                  className="px-2 py-5 text-center text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em]"
                >
                  {score}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {EMPLOYEES.map((employee) => (
              <tr key={employee} className="group hover:bg-neutral-50/30 transition-all duration-300">
                <td className="pl-8 pr-4 py-5">
                  <span className="text-sm font-semibold text-neutral-700 group-hover:text-brand-700 transition-colors">
                    {employee}
                  </span>
                </td>
                {SCORES.map((score) => {
                  const isSelected = values[employee] === score;
                  return (
                    <td key={score} className="px-2 py-5 text-center">
                      <button
                        onClick={() => onChange(employee, score)}
                        className={cn(
                          "w-11 h-11 rounded-xl transition-all duration-300 flex items-center justify-center text-sm font-bold border-2",
                          isSelected
                            ? "bg-brand-600 border-brand-600 text-white shadow-[0_4px_12px_rgba(101,163,13,0.3)] scale-105"
                            : "bg-white border-neutral-100 text-neutral-400 hover:border-brand-200 hover:text-brand-600 hover:bg-brand-50/50"
                        )}
                      >
                        {score}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
