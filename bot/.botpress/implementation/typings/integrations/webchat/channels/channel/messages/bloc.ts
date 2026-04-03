/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Bloc = {
  /** Fake User ID; allows the bot to pretend sending the message as someone else. */
  userId?: string;
  items: Array<
    | {
        type: "text";
        payload: {
          /** Fake User ID; allows the bot to pretend sending the message as someone else. */
          userId?: string;
          text: string;
          value?: string;
        };
      }
    | {
        type: "markdown";
        payload: {
          /** Fake User ID; allows the bot to pretend sending the message as someone else. */
          userId?: string;
          markdown: string;
        };
      }
    | {
        type: "image";
        payload: {
          /** Fake User ID; allows the bot to pretend sending the message as someone else. */
          userId?: string;
          imageUrl: string;
        };
      }
    | {
        type: "audio";
        payload: {
          /** Fake User ID; allows the bot to pretend sending the message as someone else. */
          userId?: string;
          audioUrl: string;
        };
      }
    | {
        type: "video";
        payload: {
          /** Fake User ID; allows the bot to pretend sending the message as someone else. */
          userId?: string;
          videoUrl: string;
        };
      }
    | {
        type: "file";
        payload: {
          /** Fake User ID; allows the bot to pretend sending the message as someone else. */
          userId?: string;
          fileUrl: string;
          title?: string;
        };
      }
    | {
        type: "location";
        payload: {
          /** Fake User ID; allows the bot to pretend sending the message as someone else. */
          userId?: string;
          latitude: number;
          longitude: number;
          address?: string;
          title?: string;
        };
      }
  >;
  /** Type of the message; same as the top level message type */
  type?: string;
  metadata?: { [key: string]: any };
};
