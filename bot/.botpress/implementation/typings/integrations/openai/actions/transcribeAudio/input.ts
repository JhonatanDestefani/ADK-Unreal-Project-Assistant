/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Input = {
  model?: { id: string };
  /** URL of the audio file to transcribe. The URL should return a content-type header in order to detect the audio format. Supported audio formats supported are: mp3, mp4, mpeg, mpga, m4a, wav, webm */
  fileUrl: string;
  /** The language of the input audio (optional). Supplying the input language in ISO-639-1 format will improve accuracy and latency. */
  language?: string;
  /** An optional text to guide the model's style or continue a previous audio segment. The prompt should match the audio language. */
  prompt?: string;
  /** The sampling temperature (optional), between 0 and 1. Defaults to 0 (automatic). Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. */
  temperature?: number;
};
