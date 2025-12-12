import { LLM } from "@/types"

// OpenAI-Compatible Provider
// This is a dynamic model entry that uses user-configured base URL and model name
const OPENAI_COMPATIBLE: LLM = {
  modelId: "openai-compatible",
  modelName: "OpenAI Compatible",
  provider: "openai-compatible",
  hostedId: "openai-compatible",
  platformLink: "",
  imageInput: false
}

export const OPENAI_COMPATIBLE_LLM_LIST: LLM[] = [OPENAI_COMPATIBLE]
