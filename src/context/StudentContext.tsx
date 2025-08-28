
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { initialStudents, type Student, type Transaction } from '@/data/students';

interface StudentContextType {
  students: Student[];
  getStudentById: (id: string) => Student | undefined;
  addTransaction: (studentId: string, transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (studentId: string, transactionId: string) => void;
  // TODO: Add functions for add/update/delete students
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<Student[]>(initialStudents);

  const getStudentById = (id: string) => {
    return students.find((student) => student.id === id);
  };

  const addTransaction = (studentId: string, transaction: Omit<Transaction, 'id'>) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        if (student.id === studentId) {
          const newTransaction: Transaction = {
            ...transaction,
            id: `t${Date.now()}`,
          };
          return {
            ...student,
            transactions: [...student.transactions, newTransaction],
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
