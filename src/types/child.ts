export type Child = {
  id: string;
  name: string;
  age: number;
  diagnosis?: string;
  avatar?: string;

  parentUid?: string;
  parentName?: string;
  parentEmail?: string;

  doctorUid?: string;

  level?: number;
  totalPoints?: number;
  totalExp?: number;
  goldCoins?: number;
  totalOrthosisHours?: number;
  completedMissions?: number;
  completedActivities?: number;

  createdAt?: string;
  updatedAt?: string;
};