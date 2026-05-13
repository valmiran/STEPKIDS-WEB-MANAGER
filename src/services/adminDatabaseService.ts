import { get, ref } from 'firebase/database';
import { database } from '../config/firebaseConfig';
import { UserProfile } from '../types/auth';
import { Child } from '../types/child';
import { DailyChecklist, OrthosisUsage, Symptom } from '../types/monitoring';

type UserNode = {
  profile?: UserProfile;
  children?: Record<string, Child>;
  orthosisUsage?: Record<string, OrthosisUsage>;
  checklists?: Record<string, DailyChecklist>;
  symptoms?: Record<string, Symptom>;
  activityCompletions?: Record<string, any>;
  customActivities?: Record<string, any>;
};

function mapObjectToList<T extends { id?: string }>(
  data?: Record<string, T> | null
): T[] {
  if (!data) return [];

  return Object.entries(data).map(([id, value]) => ({
    ...value,
    id,
  }));
}

export const adminDatabaseService = {
  async getAllUsers() {
    const snapshot = await get(ref(database, 'users'));

    if (!snapshot.exists()) {
      return [];
    }

    const users = snapshot.val() as Record<string, UserNode>;

    return Object.entries(users).map(([uid, value]) => ({
      uid,
      profile: value.profile,
      children: mapObjectToList<Child>(value.children),
      orthosisUsage: mapObjectToList<OrthosisUsage>(value.orthosisUsage),
      checklists: mapObjectToList<DailyChecklist>(value.checklists),
      symptoms: mapObjectToList<Symptom>(value.symptoms),
      activityCompletions: value.activityCompletions || {},
      customActivities: mapObjectToList<any>(value.customActivities),
      raw: value,
    }));
  },

  async getAllChildren() {
    const users = await this.getAllUsers();

    return users.flatMap((user) =>
      user.children.map((child) => ({
        ...child,
        parentUid: user.uid,
        parentName: user.profile?.full_name || 'Responsável não informado',
        parentEmail: user.profile?.email || '',
      }))
    );
  },

  async getChildDetails(parentUid: string, childId: string) {
    const snapshot = await get(ref(database, `users/${parentUid}`));

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.val() as UserNode;
    const child = data.children?.[childId];

    if (!child) {
      return null;
    }

    const orthosisUsage = mapObjectToList<OrthosisUsage>(
      data.orthosisUsage
    ).filter((item) => item.child === childId);

    const checklists = mapObjectToList<DailyChecklist>(
      data.checklists
    ).filter((item) => item.child === childId);

    const symptoms = mapObjectToList<Symptom>(
      data.symptoms
    ).filter((item) => item.child === childId);

    return {
      child: {
        ...child,
        id: childId,
        parentUid,
      },
      parent: data.profile,
      orthosisUsage,
      checklists,
      symptoms,
    };
  },
};