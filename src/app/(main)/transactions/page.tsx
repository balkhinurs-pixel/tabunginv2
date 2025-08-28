import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import NewTransactionDialog from '@/components/transactions/NewTransactionDialog';

const transactions = [
  { id: 'TRX001', student: 'John Doe', type: 'Deposit', amount: 50.00, date: '2023-10-26' },
  { id: 'TRX002', student: 'Jane Smith', type: 'Withdrawal', amount: 20.00, date: '2023-10-25' },
  { id: 'TRX003', student: 'Peter Jones', type: 'Deposit', amount: 100.00, date: '2023-10-25' },
  { id: 'TRX004', student: 'Mary Johnson', type: 'Deposit', amount: 75.00, date: '2023-10-24' },
  { id: 'TRX005', student: 'John Doe', type: 'Withdrawal', amount: 15.00, date: '2023-10-23' },
];

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
            <p className="text-muted-foreground">
                Record and view all student transactions.
            </p>
        </div>
        <NewTransactionDialog />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.id}</TableCell>
                <TableCell>{transaction.student}</TableCell>
                <TableCell>
                  <Badge variant={transaction.type === 'Deposit' ? 'default' : 'destructive'} className={transaction.type === 'Deposit' ? 'bg-green-600' : ''}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.date}</TableCell>
                <TableCell className="text-right">
                  {transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
