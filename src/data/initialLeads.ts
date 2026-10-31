import { Lead } from '../types/lead';

// Master spreadsheet database is cleared. Only genuine user-uploaded spreadsheet data is used.
export const INITIAL_SEED_LEADS: Lead[] = [];

export const INITIAL_SEED_QUEUE: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[] = [];
