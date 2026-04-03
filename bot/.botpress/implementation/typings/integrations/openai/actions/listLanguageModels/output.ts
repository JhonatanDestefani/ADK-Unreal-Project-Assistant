/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Output = {
  models: Array<
    {
      /** Unique identifier of the large language model */
      id: string;
      name: string;
      description: string;
      tags: Array<
        | "recommended"
        | "deprecated"
        | "general-purpose"
        | "low-cost"
        | "vision"
        | "coding"
        | "agents"
        | "function-calling"
        | "roleplay"
        | "storytelling"
        | "reasoning"
        | "preview"
      >;
      input: {
        maxTokens: number;
        /** Cost per 1 million tokens, in U.S. dollars */
        costPer1MTokens: number;
      };
      output: {
        maxTokens: number;
        /** Cost per 1 million tokens, in U.S. dollars */
        costPer1MTokens: number;
      };
    } & {
      /** Model to use for content generation */
      id:
        | "gpt-5.4-2026-03-05"
        | "gpt-5.3-2026-02-06"
        | "gpt-5.2-2025-12-11"
        | "gpt-5.1-2025-11-13"
        | "gpt-5-2025-08-07"
        | "gpt-5-mini-2025-08-07"
        | "gpt-5-nano-2025-08-07"
        | "o4-mini-2025-04-16"
        | "o3-2025-04-16"
        | "gpt-4.1-2025-04-14"
        | "gpt-4.1-mini-2025-04-14"
        | "gpt-4.1-nano-2025-04-14"
        | "o3-mini-2025-01-31"
        | "o1-2024-12-17"
        | "o1-mini-2024-09-12"
        | "gpt-4o-mini-2024-07-18"
        | "gpt-4o-2024-11-20"
        | "gpt-4o-2024-08-06"
        | "gpt-4o-2024-05-13"
        | "gpt-4-turbo-2024-04-09"
        | "gpt-3.5-turbo-0125";
    }
  >;
};
