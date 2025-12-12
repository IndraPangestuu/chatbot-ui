# Implementation Plan

- [x] 1. Database Schema Extension





  - [x] 1.1 Create Supabase migration for new profile column


    - Add `tavily_api_key` column to profiles table
    - Update trigger function for new user profile creation
    - _Requirements: 1.3, 5.2_


  - [x] 1.2 Regenerate Supabase types





    - Run `npm run db-types` to update `supabase/types.ts`
    - _Requirements: 5.2_

- [x] 2. Tavily Search Service




  - [x] 2.1 Create Tavily search service


    - Create `lib/tools/tavily-search.ts`
    - Implement `tavilySearch` function to call Tavily API
    - Handle API response parsing
    - _Requirements: 2.2, 2.3_


  - [x] 2.2 Implement error handling in service





    - Handle connection errors
    - Handle authentication errors (401)
    - Extract error messages from API responses
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 2.3 Write property test for error message extraction
    - **Property 5: Error Message Extraction**
    - **Validates: Requirements 4.3**

- [x] 3. Tool Definition and Formatting





  - [x] 3.1 Create Tavily tool definition


    - Create `lib/tools/tavily-tool-definition.ts`
    - Define web_search function schema for OpenAI function calling
    - _Requirements: 2.1, 5.1_
  - [x] 3.2 Create source formatting utility


    - Create function to format search results with citations
    - Include title and URL for each source
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ]* 3.3 Write property test for source formatting
    - **Property 4: Source Formatting Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 4. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Profile Settings UI





  - [x] 5.1 Add state variable for Tavily API key


    - Add state for API key in `components/utility/profile-settings.tsx`
    - Initialize from profile data
    - _Requirements: 1.1_
  - [x] 5.2 Add UI input for Tavily API key

    - Add collapsible section for Tavily
    - Add API key input field with password type
    - Add link to Tavily website for getting API key
    - _Requirements: 1.1, 1.2_

  - [x] 5.3 Update save handler





    - Include Tavily API key in profile update
    - _Requirements: 1.3_
  - [ ]* 5.4 Write property test for API key validation
    - **Property 1: API Key Validation**
    - **Validates: Requirements 1.2**
  - [ ]* 5.5 Write property test for settings persistence
    - **Property 2: Settings Persistence Round-Trip**
    - **Validates: Requirements 1.3**

- [x] 6. Server Helpers Update





  - [x] 6.1 Update server-chat-helpers


    - Add Tavily API key retrieval in `lib/server/server-chat-helpers.ts`
    - _Requirements: 5.1_

- [x] 7. Chat Route Integration





  - [x] 7.1 Create chat route with Tavily support


    - Update existing chat routes or create new route that supports tools
    - Check if Tavily API key is configured
    - Add web_search tool to available tools when configured
    - _Requirements: 2.1, 5.1_
  - [x] 7.2 Implement tool call handling


    - Handle web_search tool calls from model
    - Call Tavily search service
    - Return results to model
    - _Requirements: 2.2, 2.3_


  - [x] 7.3 Implement graceful degradation





    - Continue conversation if search fails
    - Log errors for debugging
    - _Requirements: 4.4_
  - [ ]* 7.4 Write property test for tool availability
    - **Property 3: Tool Availability Based on Configuration**
    - **Validates: Requirements 2.1**


- [x] 8. Valid Keys Update





  - [x] 8.1 Update valid keys enum

    - Add `TAVILY_API_KEY` to `types/valid-keys.ts`
    - _Requirements: 5.1_

- [x] 9. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

