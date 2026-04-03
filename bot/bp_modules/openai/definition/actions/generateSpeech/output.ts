/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const output = {
  schema: z
    .object({
      audioUrl: z
        .string()
        .title("Audio Url")
        .describe("URL to the audio file with the generated speech"),
      botpress: z
        .object({
          cost: z
            .number()
            .title("Cost")
            .describe("Cost of the speech generation, in U.S. dollars"),
        })
        .catchall(z.never())
        .title("Botpress")
        .describe("Cost of the speech generation, in U.S. dollars"),
    })
    .catchall(z.never()),
};
