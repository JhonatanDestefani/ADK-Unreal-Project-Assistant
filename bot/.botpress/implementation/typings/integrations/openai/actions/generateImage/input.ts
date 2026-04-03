/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Input = {
  model?: { id: string };
  /** Text prompt describing the image to be generated */
  prompt: string;
  /** Desired size of the generated image */
  size?: string;
  /** Expiration of the generated image in days, after which the image will be automatically deleted to free up storage space in your account. The default is to keep the image indefinitely (no expiration). The minimum is 30 days and the maximum is 90 days. */
  expiration?: number;
  params?: {
    /** Image style - Only supported by DALL-E 3 models */
    style?: "natural" | "vivid";
    /** User ID to associate with the image, for abuse detection purposes */
    user?: string;
  };
};
