import { LLM } from "@/types"

// OpenAI-Compatible Provider
// Include a generic entry plus known AgentRouter-hosted models (selectable when configured)
const OPENAI_COMPATIBLE: LLM = {
  modelId: "openai-compatible",
  modelName: "OpenAI Compatible",
  provider: "openai-compatible",
  hostedId: "openai-compatible",
  platformLink: "",
  imageInput: false
}

// AgentRouter example models (these will be shown when user configures an OpenAI-compatible base URL)
const DEEPSEEK_R1_0528: LLM = {
  modelId: "deepseek-r1-0528",
  modelName: "DeepSeek r1 (AgentRouter)",
  provider: "openai-compatible",
  hostedId: "deepseek-r1-0528",
  platformLink: "https://agentrouter.org/",
  imageInput: false
}

export const OPENAI_COMPATIBLE_LLM_LIST: LLM[] = [
  OPENAI_COMPATIBLE,
  DEEPSEEK_R1_0528
]
