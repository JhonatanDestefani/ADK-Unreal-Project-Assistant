/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const input = {
  schema: z
    .object({
      model: z.optional(
        z
          .object({
            id: z.string(),
          })
          .catchall(z.never()),
      ),
      prompt: z
        .string()
        .title("Image Prompt")
        .describe("Text prompt describing the image to be generated"),
      size: z.optional(
        z
          .string()
          .title("Image Size")
          .describe("Desired size of the generated image"),
      ),
      expiration: z.optional(
        z
          .number()
          .int(undefined)
          .min(30, undefined)
          .max(90, undefined)
          .title("Image Expiry (Days)")
          .describe(
            "Expiration of the generated image in days, after which the image will be automatically deleted to free up storage space in your account. The default is to keep the image indefinitely (no expiration). The minimum is 30 days and the maximum is 90 days.",
          ),
      ),
      params: z.optional(
        z
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
      ),
    })
    .catchall(z.never()),
};
