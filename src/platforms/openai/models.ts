// Type-only import keeps this module safe to use from client components
import type { OpenAIProvider } from '@ai-sdk/openai';

export type OpenAIModel = Parameters<OpenAIProvider>[0];

// OpenAIModel ends in a `string` catch-all so callers can pass ids newer than
// the SDK, which also means typos survive until OpenAI rejects them at
// runtime. Dropping that member gets the ids the SDK actually knows about.
type KnownModel<T> = T extends string
  ? string extends T ? never : T
  : never;

export type OpenAIModelKnown = KnownModel<OpenAIModel>;

export const OPENAI_MODEL_DEFAULT: OpenAIModelKnown = 'gpt-5.2';
export const OPENAI_MODEL_COMPATIBLE: OpenAIModelKnown = 'gpt-4o';
