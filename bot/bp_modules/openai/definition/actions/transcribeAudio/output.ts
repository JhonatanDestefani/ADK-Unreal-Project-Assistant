/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const output = {
  schema: z
    .object({
      language: z
        .string()
        .title("Detected Language")
        .describe("Detected language of the audio"),
      duration: z
        .number()
        .title("Audio Duration")
        .describe("Duration of the audio file, in seconds"),
      segments: z
        .array(
          z
            .object({
              text: z
                .string()
                .title("Segment Text Content")
                .describe("Text content of the segment."),
              id: z
                .number()
                .title("Segment ID")
                .describe("Unique identifier of the segment"),
              seek: z
                .number()
                .title("Seek Offset")
                .describe("Seek offset of the segment"),
              start: z
                .number()
                .title("Segment Start Time")
                .describe("Start time of the segment in seconds."),
              end: z
                .number()
                .title("Segment End Time")
                .describe("End time of the segment in seconds."),
              tokens: z
                .array(z.number())
                .title("Text Token IDs")
                .describe("Array of token IDs for the text content."),
              temperature: z
                .number()
                .title("Temperature")
                .describe(
                  "Temperature parameter used for generating the segment.",
                ),
              avg_logprob: z
                .number()
                .describe(
                  "Average logprob of the segment. If the value is lower than -1, consider the logprobs failed.",
                ),
              compression_ratio: z
                .number()
                .describe(
                  "Compression ratio of the segment. If the value is greater than 2.4, consider the compression failed.",
                ),
              no_speech_prob: z
                .number()
                .describe(
                  "Probability of no speech in the segment. If the value is higher than 1.0 and the avg_logprob is below -1, consider this segment silent.",
                ),
            })
            .catchall(z.never()),
        )
        .title("Transcription Segments")
        .describe("List of transcription segments"),
      model: z.string().title("AI Model Name").describe("Model name used"),
      cost: z
        .number()
        .title("Transcription Cost")
        .describe(
          "Total cost of the transcription, in U.S. dollars (DEPRECATED)",
        ),
      botpress: z
        .object({
          cost: z
            .number()
            .title("Transcription Cost")
            .describe("Total cost of the transcription, in U.S. dollars"),
        })
        .catchall(z.never())
        .title("Botpress Metadata")
        .describe("Metadata added by Botpress"),
    })
    .catchall(z.never()),
};
