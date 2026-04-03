/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Input = {
  model?: {
    /** Model to use for content generation */
    id:
      | "gpt-5.4-2026-03-05"
      | "gpt-5.3-2026-02-06"
      | "gpt-5.2-2025-12-11"
      | "gpt-5.1-2025-11-13"
      | "gpt-5-2025-08-07"
      | "gpt-5-mini-2025-08-07"
      | "gpt-5-nano-2025-08-07"
      | "o4-mini-2025-04-16"
      | "o3-2025-04-16"
      | "gpt-4.1-2025-04-14"
      | "gpt-4.1-mini-2025-04-14"
      | "gpt-4.1-nano-2025-04-14"
      | "o3-mini-2025-01-31"
      | "o1-2024-12-17"
      | "o1-mini-2024-09-12"
      | "gpt-4o-mini-2024-07-18"
      | "gpt-4o-2024-11-20"
      | "gpt-4o-2024-08-06"
      | "gpt-4o-2024-05-13"
      | "gpt-4-turbo-2024-04-09"
      | "gpt-3.5-turbo-0125";
  };
  /**
   * Reasoning effort level to use for models that support reasoning. Specifying "none" will indicate the LLM to not use reasoning (for models that support optional reasoning). A "dynamic" effort will indicate the provider to automatically determine the reasoning effort (if supported by the provider). If not provided the model will not use reasoning for models with optional reasoning or use the default reasoning effort specified by the provider for reasoning-only models.
   * Note: A higher reasoning effort will incur in higher output token charges from the LLM provider.
   */
  reasoningEffort?: "low" | "medium" | "high" | "dynamic" | "none";
  /** Optional system prompt to guide the model */
  systemPrompt?: string;
  /** Array of messages for the model to process */
  messages: Array<{
    role: "user" | "assistant";
    type?: "text" | "tool_calls" | "tool_result" | "multipart";
    /** Required if `type` is "tool_calls" */
    toolCalls?: Array<{
      id: string;
      type: "function";
      function: {
        name: string;
        arguments: /** Some LLMs may generate invalid JSON for a tool call, so this will be `null` when it happens. */ {
          [key: string]: any;
        } | null;
      };
    }>;
    /** Required if `type` is "tool_result" */
    toolResultCallId?: string;
    content: /** Required unless `type` is "tool_call". If `type` is "multipart", this field must be an array of content objects. If `type` is "tool_result" then this field should be the result of the tool call (a plain string or a JSON-encoded array or object). If `type` is "tool_call" then the `toolCalls` field should be used instead. */
      | string
      | Array<{
          type: "text" | "image";
          /** Indicates the MIME type of the content. If not provided it will be detected from the content-type header of the provided URL. */
          mimeType?: string;
          /** Required if part type is "text" */
          text?: string;
          /** Required if part type is "image" */
          url?: string;
        }>
      | null;
  }>;
  /** Response format expected from the model. If "json_object" is chosen, you must instruct the model to generate JSON either via the system prompt or a user message. */
  responseFormat?: "text" | "json_object";
  /** Maximum number of tokens allowed in the generated response */
  maxTokens?: number;
  /** Sampling temperature for the model. Higher values result in more random outputs. */
  temperature?: number;
  /** Top-p sampling parameter. Limits sampling to the smallest set of tokens with a cumulative probability above the threshold. */
  topP?: number;
  /** Sequences where the model should stop generating further tokens. */
  stopSequences?: string[];
  /** List of tools available for the model to use */
  tools?: Array<{
    type: "function";
    function: {
      /** Function name */
      name: string;
      description?: string;
      /** JSON schema of the function arguments */
      argumentsSchema?: {};
    };
  }>;
  /** The chosen tool to use for content generation */
  toolChoice?: {
    type?: "auto" | "specific" | "any" | "none" | "";
    /** Required if `type` is "specific" */
    functionName?: string;
  };
  /** Unique identifier of the user that sent the prompt */
  userId?: string;
  /** Set to `true` to output debug information to the bot logs */
  debug?: boolean;
  /** Contextual metadata about the prompt */
  meta?: {
    /** Source of the prompt, e.g. agent/:id/:version cards/ai-generate, cards/ai-task, nodes/autonomous, etc. */
    promptSource?: string;
    promptCategory?: string;
    /** Name of the integration that originally received the message that initiated this action */
    integrationName?: string;
  };
};
