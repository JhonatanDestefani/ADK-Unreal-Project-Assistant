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
              .describe("Unique identifier of the speech-to-text model"),
            name: z.string(),
            costPerMinute: z
              .number()
              .describe(
                "Cost per minute of speech transcription, in U.S. dollars",
              ),
          }),
          z.object({
            id: z.string(),
          }),
        ),
      ),
    })
    .catchall(z.never()),
};
