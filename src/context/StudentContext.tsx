
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { initialStudents, type Student, type Transaction } from '@/data/students';
import { format } from 'date-fns';

interface StudentContextType {
  students: Student[];
  getStudentById: (id: string) => Student | undefined;
  addTransaction: (studentId: string, transaction: Omit<Transaction, 'id' | 'type' | 'date'>, type: 'Pemasukan' | 'Pengeluaran') => void;
  deleteTransaction: (studentId: string, transactionId: string) => void;
  addStudent: (student: Omit<Student, 'id' | 'transactions'>) => void;
  updateStudent: (studentId: string, studentData: Omit<Student, 'id' | 'transactions'>) => void;
  deleteStudent: (studentId: string) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<Student[]>(initialStudents);

  const getStudentById = (id: string) => {
    return students.find((student) => student.id === id);
  };

  const addStudent = (studentData: Omit<Student, 'id' | 'transactions'>) => {
    setStudents((prevStudents) => [
      ...prevStudents,
      {
        ...studentData,
        id: `s${Date.now()}`,
        transactions: [],
      },
    ]);
  };

  const updateStudent = (studentId: string, studentData: Omit<Student, 'id' | 'transactions'>) => {
     setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === studentId ? { ...student, ...studentData } : student
      )
    );
  }

  const deleteStudent = (studentId: string) => {
    setStudents((prevStudents) => prevStudents.filter((student) => student.id !== studentId));
  }

  const addTransaction = (studentId: string, transaction: Omit<Transaction, 'id' | 'type' | 'date'>, type: 'Pemasukan' | 'Pengeluaran') => {
    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        if (student.id === studentId) {
          const newTransaction: Transaction = {
            ...transaction,
            id: `t${Date.now()}`,
            type,
            date: format(new Date(), 'dd/MM/yy'),
          };
          return {
            ...student,
            transactions: [newTransaction, ...student.transactions],
          };
        }
        return student;
      })
    );
  };

  const deleteTransaction = (studentId: string, transactionId: string) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        if (student.id === studentId) {
          return {
            ...student,
            transactions: student.transactions.filter(
              (tx) => tx.id !== transactionId
            ),
          };
        }
        return student;
      })
    );
  };

  const value = {
    students,
    getStudentById,
    addTransaction,
    deleteTransaction,
    addStudent,
    updateStudent,
    deleteStudent,
  };

  return (
    <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
  );
};

export const useStudent = (): StudentContextType => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};
