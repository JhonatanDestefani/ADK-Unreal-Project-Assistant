/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Input = {
  /** The model used */
  model?: "tts-1" | "tts-1-hd";
  /** The input */
  input: string;
  /** The voice used */
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  /** The format used */
  format?: "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";
  /** The speed used */
  speed?: number;
  /** Expiration of the generated audio file in days, after which the file will be automatically deleted to free up storage space in your account. The default is to keep the file indefinitely (no expiration). The minimum is 30 days and the maximum is 90 days. */
  expiration?: number;
};
