export type OrthosisUsage = {
  id: string;
  child: string;
  used_today: boolean;
  usage_hours: number;
  notes?: string;
  date?: string;
  createdAt?: string;
};

export type DailyChecklist = {
  id: string;
  child: string;
  used_today: boolean;
  felt_pain: boolean;
  slept_with_orthosis: boolean;
  restlessness?: boolean;
  notes?: string;
  pointsEarned?: number;
  date?: string;
  createdAt?: string;
};

export type Symptom = {
  id: string;
  child: string;
  symptom_type: string;
  intensity: number;
  description?: string;
  mood?: string;
  date?: string;
  createdAt?: string;
};