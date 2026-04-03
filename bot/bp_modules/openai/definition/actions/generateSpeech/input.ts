/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const input = {
  schema: z
    .object({
      model: z.optional(
        z
          .enum(["tts-1", "tts-1-hd"])
          .title("Model")
          .placeholder("tts-1")
          .describe("The model used"),
      ),
      input: z.string().title("Input").describe("The input"),
      voice: z.optional(
        z
          .enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"])
          .title("Voice")
          .placeholder("alloy")
          .describe("The voice used"),
      ),
      format: z.optional(
        z
          .enum(["mp3", "opus", "aac", "flac", "wav", "pcm"])
          .title("Format")
          .placeholder("mp3")
          .describe("The format used"),
      ),
      speed: z.optional(
        z
          .number()
          .min(0.25, undefined)
          .max(4, undefined)
          .title("Spedd")
          .placeholder("1")
          .describe("The speed used"),
      ),
      expiration: z.optional(
        z
          .number()
          .int(undefined)
          .min(30, undefined)
          .max(90, undefined)
          .title("Expiration")
          .describe(
            "Expiration of the generated audio file in days, after which the file will be automatically deleted to free up storage space in your account. The default is to keep the file indefinitely (no expiration). The minimum is 30 days and the maximum is 90 days.",
          ),
      ),
    })
    .catchall(z.never()),
};
