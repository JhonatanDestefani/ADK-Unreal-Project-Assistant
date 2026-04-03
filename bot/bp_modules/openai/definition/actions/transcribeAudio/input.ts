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
      fileUrl: z
        .string()
        .url(undefined)
        .title("Audio File URL")
        .describe(
          "URL of the audio file to transcribe. The URL should return a content-type header in order to detect the audio format. Supported audio formats supported are: mp3, mp4, mpeg, mpga, m4a, wav, webm",
        ),
      language: z.optional(
        z
          .string()
          .title("Audio Language")
          .describe(
            "The language of the input audio (optional). Supplying the input language in ISO-639-1 format will improve accuracy and latency.",
          ),
      ),
      prompt: z.optional(
        z
          .string()
          .title("Transcription Prompt")
          .describe(
            "An optional text to guide the model\'s style or continue a previous audio segment. The prompt should match the audio language.",
          ),
      ),
      temperature: z.default(
        z
          .number()
          .title("Temperature")
          .describe(
            "The sampling temperature (optional), between 0 and 1. Defaults to 0 (automatic). Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.",
          ),
        0,
      ),
    })
    .catchall(z.never()),
};
