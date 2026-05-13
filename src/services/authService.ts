import { signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },
};