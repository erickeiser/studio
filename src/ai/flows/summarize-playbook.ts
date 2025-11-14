'use server';

/**
 * @fileOverview A playbook summarization AI agent.
 *
 * - summarizePlaybook - A function that handles the playbook summarization process.
 * - SummarizePlaybookInput - The input type for the summarizePlaybook function.
 * - SummarizePlaybookOutput - The return type for the summarizePlaybook function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePlaybookInputSchema = z.object({
  playbookContent: z
    .string()
    .describe('The content of the playbook to be summarized.'),
});
export type SummarizePlaybookInput = z.infer<typeof SummarizePlaybookInputSchema>;

const SummarizePlaybookOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the provided playbook content.'),
});
export type SummarizePlaybookOutput = z.infer<typeof SummarizePlaybookOutputSchema>;

export async function summarizePlaybook(
  input: SummarizePlaybookInput
): Promise<SummarizePlaybookOutput> {
  return summarizePlaybookFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePlaybookPrompt',
  input: {schema: SummarizePlaybookInputSchema},
  output: {schema: SummarizePlaybookOutputSchema},
  prompt: `You are an expert football coach, skilled at quickly understanding playbooks.

  Please provide a concise summary of the following playbook content, highlighting key plays and strategies. 

  Playbook Content: {{{playbookContent}}}`,
});

const summarizePlaybookFlow = ai.defineFlow(
  {
    name: 'summarizePlaybookFlow',
    inputSchema: SummarizePlaybookInputSchema,
    outputSchema: SummarizePlaybookOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
