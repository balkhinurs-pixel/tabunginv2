import type { Student } from '@/types';

export const initialStudents: Student[] = [
  {
    id: '1',
    nis: '24001',
    name: 'Balkhi',
    class: '9a',
    transactions: [
      { id: 't1', date: '12/07/24', type: 'Pemasukan', description: 'harian', amount: 500000 },
      { id: 't2', date: '12/07/24', type: 'Pemasukan', description: 'bulanan', amount: 5000000 },
      { id: 't3', date: '13/07/24', type: 'Pengeluaran', description: 'jajan', amount: 25000 },
    ],
  },
  {
    id: '2',
    nis: '24002',
    name: 'Jane Smith',
    class: '9b',
    transactions: [
      { id: 't4', date: '14/07/24', type: 'Pemasukan', description: 'Setoran Ortu', amount: 200000 },
      { id: 't5', date: '15/07/24', type: 'Pengeluaran', description: 'Beli buku', amount: 75000 },
    ],
  },
];
