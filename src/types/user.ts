export interface AppUser {
  id: string;
  username: string;
  password: string;
  role: 'buyer' | 'admin';
  name?: string;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
  notes?: string;
}

export const INITIAL_SEED_USERS: AppUser[] = [
  {
    id: 'user-admin-master',
    username: 'salesleads777@gmail.com',
    password: 'Mafioso2356$',
    role: 'admin',
    name: 'Master Administrator',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    notes: 'Primary Master Admin',
  },
  {
    id: 'user-closer-default',
    username: '1clickleads',
    password: '1clickadmin',
    role: 'buyer',
    name: 'Executive Closer',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    notes: 'Standard Client Closer Account',
  },
];
