'use server';

/**
 * @fileOverview An AI agent that suggests simulation configurations and parameters.
 *
 * - suggestSimulationParameters - A function that suggests simulation configurations and parameters.
 * - SuggestSimulationParametersInput - The input type for the suggestSimulationParameters function.
 * - SuggestSimulationParametersOutput - The return type for the suggestSimulationParameters function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSimulationParametersInputSchema = z.object({
  uploadedFiles: z
    .array(z.string())
    .describe("List of names of the uploaded files, including CSV, JSON, or XML files."),
  previousSimulationData: z
    .string()
    .optional()
    .describe("Data from previous simulations, if available, to help refine suggestions."),
});
export type SuggestSimulationParametersInput = z.infer<
  typeof SuggestSimulationParametersInputSchema
>;

const SuggestSimulationParametersOutputSchema = z.object({
  suggestedConfigurations: z
    .array(z.string())
    .describe("Suggested simulation configurations based on the uploaded data and previous simulations."),
  suggestedParameters: z
    .object({
      parameterName: z.string(),
      suggestedValue: z.string(),
      reason: z.string().optional(),
    })
    .array()
    .describe("Suggested simulation parameters with suggested values and reasons."),
  scenariosToConsider: z
    .array(z.string())
    .describe("Recommended scenarios to consider for the simulation."),
  dataInputsForConsideration: z
    .array(z.string())
    .describe("Recommended data inputs to consider for the simulation."),
});
export type SuggestSimulationParametersOutput = z.infer<
  typeof SuggestSimulationParametersOutputSchema
>;

export async function suggestSimulationParameters(
  input: SuggestSimulationParametersInput
): Promise<SuggestSimulationParametersOutput> {
  return suggestSimulationParametersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSimulationParametersPrompt',
  input: {schema: SuggestSimulationParametersInputSchema},
  output: {schema: SuggestSimulationParametersOutputSchema},
  prompt: `You are an AI assistant designed to provide intelligent suggestions for simulation configurations and parameters based on user-provided data.

  Analyze the following uploaded files: {{{uploadedFiles}}}

  {{~#if previousSimulationData}}
  Taking into account data from previous simulations: {{{previousSimulationData}}}
  {{~/if}}

  Suggest relevant simulation configurations, parameters, scenarios, and additional data inputs to consider. Provide the reason why each suggested parameter is relevant to the simulation.

  Ensure the output is a valid JSON object matching the following schema:
  ${JSON.stringify(SuggestSimulationParametersOutputSchema.shape, null, 2)}
  `,
});

const suggestSimulationParametersFlow = ai.defineFlow(
  {
    name: 'suggestSimulationParametersFlow',
    inputSchema: SuggestSimulationParametersInputSchema,
    outputSchema: SuggestSimulationParametersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
