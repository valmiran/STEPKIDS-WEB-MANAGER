import { get, push, ref, remove, set } from 'firebase/database';

import { database } from '../config/firebaseConfig';
import { EducationalContent } from '../types/educationalContent';

function mapObjectToList<T extends { id?: string }>(
  data?: Record<string, T> | null,
): T[] {
  if (!data) return [];

  return Object.entries(data).map(([id, value]) => ({
    ...value,
    id,
  }));
}

export const educationalContentService = {
  async getAll() {
    const snapshot = await get(ref(database, 'educationalContents'));

    if (!snapshot.exists()) {
      return [];
    }

    return mapObjectToList<EducationalContent>(snapshot.val());
  },

  async create(content: Omit<EducationalContent, 'id'>) {
    const contentRef = push(ref(database, 'educationalContents'));

    await set(contentRef, content);

    return {
      ...content,
      id: contentRef.key || undefined,
    };
  },

  async delete(contentId: string) {
    await remove(ref(database, `educationalContents/${contentId}`));
  },
};