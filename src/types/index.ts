
export interface Transaction {
  id: string;
  created_at?: string;
  type: 'Pemasukan' | 'Pengeluaran';
  description: string;
  amount: number;
  student_id: string; 
  user_id?: string;
  // Joined properties
  students?: {
    id: string;
    name: string;
  }
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  class: string;
  whatsapp_number?: string;
  created_at?: string;
  user_id?: string;
  transactions: Transaction[];
}

export interface Profile {
  id: string;
  email?: string;
  plan: 'TRIAL' | 'PRO';
  // Add other profile fields if needed
}

    