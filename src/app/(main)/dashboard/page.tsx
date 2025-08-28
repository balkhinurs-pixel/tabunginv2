import { DollarSign, Users, PiggyBank } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import SavingsChart from '@/components/dashboard/SavingsChart';
import FinancialSummary from '@/components/dashboard/FinancialSummary';

export default function DashboardPage() {
    const totalSavings = 12500.75;
    const totalDeposits = 5000;
    const totalWithdrawals = 1200;
    
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Savings"
          value={totalSavings.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          icon={DollarSign}
        />
        <StatCard
          title="Active Students"
          value="124"
          icon={Users}
        />
        <StatCard
          title="Avg. Savings per Student"
          value={(12500.75 / 124).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          icon={PiggyBank}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
         <FinancialSummary savings={totalSavings} deposits={totalDeposits} withdrawals={totalWithdrawals} />
         <SavingsChart />
      </div>
    </div>
  );
}
