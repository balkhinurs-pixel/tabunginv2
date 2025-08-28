'use server';

/**
 * @fileOverview An AI-powered financial summary dashboard flow.
 *
 * - getFinancialSummary - A function that generates a summarized overview of financial metrics.
 * - FinancialSummaryInput - The input type for the getFinancialSummary function.
 * - FinancialSummaryOutput - The return type for the getFinancialSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialSummaryInputSchema = z.object({
  savings: z.number().describe('Total savings amount.'),
  deposits: z.number().describe('Total deposits amount.'),
  withdrawals: z.number().describe('Total withdrawals amount.'),
});
export type FinancialSummaryInput = z.infer<typeof FinancialSummaryInputSchema>;

const FinancialSummaryOutputSchema = z.object({
  summary: z.string().describe('A summarized overview of the financial status.'),
  recommendations: z.string().describe('Personalized recommendations based on the financial status.'),
});
export type FinancialSummaryOutput = z.infer<typeof FinancialSummaryOutputSchema>;

export async function getFinancialSummary(input: FinancialSummaryInput): Promise<FinancialSummaryOutput> {
  return financialSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialSummaryPrompt',
  input: {schema: FinancialSummaryInputSchema},
  output: {schema: FinancialSummaryOutputSchema},
  prompt: `You are a personal finance advisor. Provide a summarized overview of the user's financial status based on their savings, deposits, and withdrawals.

  Savings: {{{savings}}}
  Deposits: {{{deposits}}}
  Withdrawals: {{{withdrawals}}}

  Also, provide personalized recommendations to improve their financial health.
  Format the output as a JSON object with 'summary' and 'recommendations' fields.`,
});

const financialSummaryFlow = ai.defineFlow(
  {
    name: 'financialSummaryFlow',
    inputSchema: FinancialSummaryInputSchema,
    outputSchema: FinancialSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
