/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const output = {
  schema: z
    .object({
      models: z.array(
        z.intersection(
          z.object({
            id: z
              .string()
              .describe("Unique identifier of the large language model"),
            name: z.string(),
            description: z.string(),
            tags: z.array(
              z.enum([
                "recommended",
                "deprecated",
                "general-purpose",
                "low-cost",
                "vision",
                "coding",
                "agents",
                "function-calling",
                "roleplay",
                "storytelling",
                "reasoning",
                "preview",
              ]),
            ),
            input: z
              .object({
                maxTokens: z.number().int(undefined),
                costPer1MTokens: z
                  .number()
                  .describe("Cost per 1 million tokens, in U.S. dollars"),
              })
              .catchall(z.never()),
            output: z
              .object({
                maxTokens: z.number().int(undefined),
                costPer1MTokens: z
                  .number()
                  .describe("Cost per 1 million tokens, in U.S. dollars"),
              })
              .catchall(z.never()),
          }),
          z.object({
            id: z
              .enum([
                "gpt-5.4-2026-03-05",
                "gpt-5.3-2026-02-06",
                "gpt-5.2-2025-12-11",
                "gpt-5.1-2025-11-13",
                "gpt-5-2025-08-07",
                "gpt-5-mini-2025-08-07",
                "gpt-5-nano-2025-08-07",
                "o4-mini-2025-04-16",
                "o3-2025-04-16",
                "gpt-4.1-2025-04-14",
                "gpt-4.1-mini-2025-04-14",
                "gpt-4.1-nano-2025-04-14",
                "o3-mini-2025-01-31",
                "o1-2024-12-17",
                "o1-mini-2024-09-12",
                "gpt-4o-mini-2024-07-18",
                "gpt-4o-2024-11-20",
                "gpt-4o-2024-08-06",
                "gpt-4o-2024-05-13",
                "gpt-4-turbo-2024-04-09",
                "gpt-3.5-turbo-0125",
              ])
              .describe("Model to use for content generation"),
          }),
        ),
      ),
    })
    .catchall(z.never()),
};
