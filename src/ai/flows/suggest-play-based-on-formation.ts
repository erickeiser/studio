'use server';
/**
 * @fileOverview An AI agent that suggests a football play based on the opponent's formation.
 *
 * - suggestPlayBasedOnFormation - A function that suggests a play given an opponent formation.
 * - SuggestPlayBasedOnFormationInput - The input type for the suggestPlayBasedOnFormation function.
 * - SuggestPlayBasedOnFormationOutput - The return type for the suggestPlayBasedOnFormation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPlayBasedOnFormationInputSchema = z.object({
  opponentFormation: z.string().describe('The opponent team\'s formation.'),
});
export type SuggestPlayBasedOnFormationInput = z.infer<
  typeof SuggestPlayBasedOnFormationInputSchema
>;

const SuggestPlayBasedOnFormationOutputSchema = z.object({
  suggestedPlay: z.string().describe('The suggested play to counter the opponent formation.'),
  rationale: z
    .string()
    .describe('The rationale behind the suggested play, explaining why it is effective.'),
});
export type SuggestPlayBasedOnFormationOutput = z.infer<
  typeof SuggestPlayBasedOnFormationOutputSchema
>;

export async function suggestPlayBasedOnFormation(
  input: SuggestPlayBasedOnFormationInput
): Promise<SuggestPlayBasedOnFormationOutput> {
  return suggestPlayBasedOnFormationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPlayBasedOnFormationPrompt',
  input: {schema: SuggestPlayBasedOnFormationInputSchema},
  output: {schema: SuggestPlayBasedOnFormationOutputSchema},
  prompt: `Given the opponent's football formation: {{{opponentFormation}}}, suggest an effective play and explain why it would be effective against this formation.  Provide both the name of the play and detailed rationale for its effectiveness in the response.`,
});

const suggestPlayBasedOnFormationFlow = ai.defineFlow(
  {
    name: 'suggestPlayBasedOnFormationFlow',
    inputSchema: SuggestPlayBasedOnFormationInputSchema,
    outputSchema: SuggestPlayBasedOnFormationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
