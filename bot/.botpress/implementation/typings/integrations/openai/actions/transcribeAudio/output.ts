/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Output = {
  /** Detected language of the audio */
  language: string;
  /** Duration of the audio file, in seconds */
  duration: number;
  /** List of transcription segments */
  segments: Array<{
    /** Text content of the segment. */
    text: string;
    /** Unique identifier of the segment */
    id: number;
    /** Seek offset of the segment */
    seek: number;
    /** Start time of the segment in seconds. */
    start: number;
    /** End time of the segment in seconds. */
    end: number;
    /** Array of token IDs for the text content. */
    tokens: number[];
    /** Temperature parameter used for generating the segment. */
    temperature: number;
    /** Average logprob of the segment. If the value is lower than -1, consider the logprobs failed. */
    avg_logprob: number;
    /** Compression ratio of the segment. If the value is greater than 2.4, consider the compression failed. */
    compression_ratio: number;
    /** Probability of no speech in the segment. If the value is higher than 1.0 and the avg_logprob is below -1, consider this segment silent. */
    no_speech_prob: number;
  }>;
  /** Model name used */
  model: string;
  /** Total cost of the transcription, in U.S. dollars (DEPRECATED) */
  cost: number;
  /** Metadata added by Botpress */
  botpress: {
    /** Total cost of the transcription, in U.S. dollars */
    cost: number;
  };
};
