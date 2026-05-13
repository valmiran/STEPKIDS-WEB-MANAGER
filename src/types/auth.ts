export type UserRole = 'parent' | 'doctor' | 'admin';

export type UserProfile = {
  id?: string;
  uid?: string;
  full_name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  photoURL?: string;
  role?: UserRole;
  createdAt?: string;
  updatedAt?: string;
};