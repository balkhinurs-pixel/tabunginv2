export interface Transaction {
  id: string;
  date: string; // We'll keep this as string to match the dummy data format 'dd/MM/yy'
  type: 'Pemasukan' | 'Pengeluaran';
  description: string;
  amount: number;
  studentId?: string; // Optional: useful for flattened transaction lists
  studentName?: string; // Optional: useful for flattened transaction lists
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  class: string;
  transactions: Transaction[];
}
