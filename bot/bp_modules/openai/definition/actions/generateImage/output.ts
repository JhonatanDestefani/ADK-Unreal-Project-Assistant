/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const output = {
  schema: z
    .object({
      model: z
        .string()
        .title("Model Name")
        .describe("The name of the generative AI Model that was used"),
      imageUrl: z
        .string()
        .title("Image URL")
        .describe("Temporary URL of generated image"),
      cost: z
        .number()
        .title("Image Generation Cost")
        .describe("Cost of the image generation, in U.S. dollars (DEPRECATED)"),
      botpress: z
        .object({
          cost: z
            .number()
            .title("Image Generation Cost")
            .describe("Cost of the image generation, in U.S. dollars"),
        })
        .catchall(z.never())
        .title("Botpress Metadata")
        .describe("Metadata added by Botpress"),
    })
    .catchall(z.never()),
};
