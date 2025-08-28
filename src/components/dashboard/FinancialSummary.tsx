'use client';

import { useState } from 'react';
import { Wand2, Loader2, Lightbulb, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFinancialSummary, type FinancialSummaryOutput } from '@/ai/flows/financial-summary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FinancialSummaryProps {
    savings: number;
    deposits: number;
    withdrawals: number;
}

export default function FinancialSummary({ savings, deposits, withdrawals }: FinancialSummaryProps) {
  const [summary, setSummary] = useState<FinancialSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getFinancialSummary({ savings, deposits, withdrawals });
      setSummary(result);
    } catch (e) {
      setError('Failed to generate summary. Please try again.');
      console.error(e);
    }
    setIsLoading(false);
  };

  return (
    <Card className="animate-fade-in-up animation-delay-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>AI Financial Advisor</CardTitle>
        <Button onClick={handleGenerateSummary} disabled={isLoading} size="sm">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Generate Insights
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive">{error}</p>}
        {summary ? (
          <div className="space-y-4">
             <Alert>
                <BarChart2 className="h-4 w-4" />
                <AlertTitle>Financial Summary</AlertTitle>
                <AlertDescription>{summary.summary}</AlertDescription>
            </Alert>
            <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Recommendations</AlertTitle>
                <AlertDescription>{summary.recommendations}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Wand2 className="mx-auto h-12 w-12" />
            <p className="mt-4">Click "Generate Insights" for a personalized summary of your financial health.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
