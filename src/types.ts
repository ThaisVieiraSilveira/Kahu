export type Criterion = 
  | "Pontualidade" 
  | "Atendimento ao cliente" 
  | "Alimentação" 
  | "Manejo" 
  | "Organização" 
  | "Limpeza" 
  | "Proatividade";

export const EMPLOYEES = [
  "Bia", "Nayara", "Lucas", "Bianca", "Arthur", 
  "Mariana", "Nathalia", "Thais", "Giovanna", 
  "Leonardo", "Marcio", "Sonia", "Claus", 
  "Marcelo", "Luigi"
];

export const CRITERIA: Criterion[] = [
  "Pontualidade",
  "Atendimento ao cliente",
  "Alimentação",
  "Manejo",
  "Organização",
  "Limpeza",
  "Proatividade"
];

export const SCORES = [0, 2, 4, 6, 8, 10];

export interface EvaluationEntry {
  evaluator: string;
  employee: string;
  criterion: Criterion;
  score: number;
  date: string;
  time: string;
}

export interface FeedbackEntry {
  evaluator: string;
  employee: string;
  positivePoints: string;
  improvementPoints: string;
  recommendAsHighlight: boolean;
  date: string;
  time: string;
}

export interface AdminStats {
  byEmployee: Record<string, number>;
  byCriterion: Record<string, number>;
  history: EvaluationEntry[];
}
