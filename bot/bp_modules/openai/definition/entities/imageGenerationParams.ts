/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const imageGenerationParams = {
  schema: z
    .object({
      style: z.default(
        z
          .enum(["natural", "vivid"])
          .describe("Image style - Only supported by DALL-E 3 models"),
        "vivid",
      ),
      user: z.optional(
        z
          .string()
          .describe(
            "User ID to associate with the image, for abuse detection purposes",
          ),
      ),
    })
    .catchall(z.never()),
};
