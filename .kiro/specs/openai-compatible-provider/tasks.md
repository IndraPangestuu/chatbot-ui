# Implementation Plan

- [x] 1. Database Schema Extension





  - [x] 1.1 Create Supabase migration for new profile columns


    - Add `openai_compatible_api_key` column to profiles table
    - Add `openai_compatible_base_url` column to profiles table  
    - Add `openai_compatible_model_name` column to profiles table
    - Update trigger function for new user profile creation
    - _Requirements: 1.3, 5.2_
  - [x] 1.2 Regenerate Supabase types


    - Run `npm run db-types` to update `supabase/types.ts`
    - _Requirements: 5.2_

- [x] 2. Type Definitions and Utilities





  - [x] 2.1 Update model provider types


    - Add "openai-compatible" to `ModelProvider` type in `types/models.ts`
    - Add `OpenAICompatibleLLMID` type to `types/llms.ts`
    - _Requirements: 5.1_


  - [x] 2.2 Create URL validation utility





    - Create `lib/utils/validate-url.ts` with URL validation function
    - Support http and https protocols
    - _Requirements: 1.2_
  - [x]* 2.3 Write property test for URL validation


    - **Property 1: URL Validation Correctness**
    - **Validates: Requirements 1.2**
  - [x] 2.4 Update valid keys enum





    - Add `OPENAI_COMPATIBLE_API_KEY` to `types/valid-keys.ts`
    - _Requirements: 5.1_

- [x] 3. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. API Route Implementation





  - [x] 4.1 Create OpenAI-compatible chat route


    - Create `app/api/chat/openai-compatible/route.ts`
    - Use OpenAI SDK with custom `baseURL` configuration
    - Implement streaming response handling
    - Follow existing pattern from `app/api/chat/openai/route.ts`
    - _Requirements: 2.2, 2.3, 2.4, 5.1_
  - [x] 4.2 Implement error handling in route

    - Handle connection errors with appropriate messages
    - Handle authentication errors (401, 403)
    - Extract and forward API error messages
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 4.3 Write property test for error message extraction
    - **Property 6: Error Message Extraction**
    - **Validates: Requirements 4.3**

- [x] 5. Server Helpers Update





  - [x] 5.1 Update server-chat-helpers


    - Add OpenAI-compatible API key mapping in `lib/server/server-chat-helpers.ts`
    - _Requirements: 5.1_

- [x] 6. LLM List and Model Integration





  - [x] 6.1 Create OpenAI-compatible LLM definition


    - Create `lib/models/llm/openai-compatible-llm-list.ts`
    - Define dynamic LLM entry for OpenAI-compatible provider
    - _Requirements: 2.1_


  - [x] 6.2 Update LLM list exports





    - Add OpenAI-compatible to `lib/models/llm/llm-list.ts`
    - Add to `LLM_LIST_MAP` for model availability
    - _Requirements: 2.1, 5.1_
  - [ ]* 6.3 Write property test for model availability
    - **Property 3: Model Availability Based on Configuration**
    - **Validates: Requirements 2.1**

- [x] 7. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Profile Settings UI






  - [x] 8.1 Add state variables for OpenAI-compatible settings

    - Add state for API key, base URL, and model name in `components/utility/profile-settings.tsx`
    - Initialize from profile data
    - _Requirements: 1.1_

  - [x] 8.2 Add UI inputs for OpenAI-compatible configuration

    - Add collapsible section for OpenAI-compatible provider
    - Add API key input field with password type
    - Add base URL input field with placeholder example
    - Add model name input field with default value hint
    - _Requirements: 1.1, 3.1_

  - [x] 8.3 Implement URL validation in UI

    - Add validation on base URL input
    - Show validation error message for invalid URLs
    - Disable save when URL is invalid
    - _Requirements: 1.2_
  - [x] 8.4 Update save handler


    - Include OpenAI-compatible fields in profile update
    - Handle model availability update after save
    - _Requirements: 1.3, 2.1_
  - [ ]* 8.5 Write property test for settings persistence
    - **Property 2: Settings Persistence Round-Trip**
    - **Validates: Requirements 1.3**

- [x] 9. Chat Handler Integration





  - [x] 9.1 Update chat helpers for OpenAI-compatible


    - Update `components/chat/chat-helpers/index.ts` to handle openai-compatible provider
    - Route to correct API endpoint based on provider
    - _Requirements: 2.2, 2.3_
  - [ ]* 9.2 Write property test for base URL usage
    - **Property 4: Base URL Usage in API Client**
    - **Validates: Requirements 2.2**
  - [ ]* 9.3 Write property test for model name propagation
    - **Property 5: Model Name Propagation**
    - **Validates: Requirements 3.2**

- [x] 10. Fetch Models Integration






  - [x] 10.1 Update fetch-models for OpenAI-compatible

    - Update `lib/models/fetch-models.ts` to handle openai-compatible provider key
    - _Requirements: 2.1, 5.1_

- [x] 11. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
