/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Carousel = {
  /** Fake User ID; allows the bot to pretend sending the message as someone else. */
  userId?: string;
  items: Array<{
    /** Fake User ID; allows the bot to pretend sending the message as someone else. */
    userId?: string;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    actions: Array<{
      action: "postback" | "url" | "say";
      label: string;
      value: string;
    }>;
  }>;
  /** Type of the message; same as the top level message type */
  type?: string;
  metadata?: { [key: string]: any };
};
