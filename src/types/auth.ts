export type UserRole = 'admin' | 'examinee';

export interface AppUser {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  examineeId?: string | null;
  createdAt: string;
}

export interface UserAccount extends AppUser {
  password: string;
}

export interface ExamineeCredentialsInput {
  username: string;
  password: string;
}
