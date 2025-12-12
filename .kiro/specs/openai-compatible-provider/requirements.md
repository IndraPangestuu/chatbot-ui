# Requirements Document

## Introduction

Fitur ini menambahkan dukungan untuk provider OpenAI-compatible dengan kemampuan mengatur custom base URL endpoint. Ini memungkinkan pengguna untuk terhubung ke berbagai layanan AI yang menggunakan API format OpenAI seperti LM Studio, LocalAI, Ollama (mode OpenAI), vLLM, Text Generation WebUI, dan layanan cloud lainnya yang menyediakan OpenAI-compatible API.

## Glossary

- **OpenAI-Compatible Provider**: Layanan AI pihak ketiga yang mengimplementasikan API dengan format yang sama seperti OpenAI API
- **Base URL**: URL endpoint dasar untuk API calls (contoh: `http://localhost:1234/v1`)
- **System**: Aplikasi Chatbot UI
- **User**: Pengguna aplikasi Chatbot UI
- **Profile Settings**: Halaman pengaturan profil pengguna di aplikasi

## Requirements

### Requirement 1

**User Story:** As a user, I want to configure an OpenAI-compatible provider with a custom base URL, so that I can connect to self-hosted or third-party AI services.

#### Acceptance Criteria

1. WHEN a user navigates to profile settings THEN the System SHALL display input fields for OpenAI-compatible provider configuration including API key and base URL
2. WHEN a user enters a base URL THEN the System SHALL validate that the URL format is valid before saving
3. WHEN a user saves the OpenAI-compatible provider settings THEN the System SHALL persist the API key and base URL to the user's profile
4. IF a user leaves the base URL empty THEN the System SHALL use a default placeholder or disable the provider

### Requirement 2

**User Story:** As a user, I want to select and use the OpenAI-compatible provider for chat, so that I can interact with my preferred AI service.

#### Acceptance Criteria

1. WHEN the OpenAI-compatible provider is configured THEN the System SHALL display it as an available model option in the model selector
2. WHEN a user selects the OpenAI-compatible provider THEN the System SHALL use the configured base URL for API requests
3. WHEN a user sends a message using the OpenAI-compatible provider THEN the System SHALL format the request according to OpenAI API specification
4. WHEN the API returns a streaming response THEN the System SHALL display the response progressively in the chat interface

### Requirement 3

**User Story:** As a user, I want to specify a custom model name for the OpenAI-compatible provider, so that I can use any model available on my endpoint.

#### Acceptance Criteria

1. WHEN a user configures the OpenAI-compatible provider THEN the System SHALL provide an input field for specifying the model name
2. WHEN a user enters a model name THEN the System SHALL use that model name in API requests
3. IF a user does not specify a model name THEN the System SHALL use a default model name value

### Requirement 4

**User Story:** As a user, I want clear error messages when the OpenAI-compatible provider fails, so that I can troubleshoot connection issues.

#### Acceptance Criteria

1. IF the API endpoint is unreachable THEN the System SHALL display an error message indicating connection failure
2. IF the API returns an authentication error THEN the System SHALL display a message about invalid API key
3. IF the API returns an error response THEN the System SHALL display the error message from the API
4. WHEN an error occurs THEN the System SHALL preserve the user's message input for retry

### Requirement 5

**User Story:** As a developer, I want the OpenAI-compatible provider implementation to follow existing patterns, so that the codebase remains maintainable.

#### Acceptance Criteria

1. WHEN implementing the API route THEN the System SHALL follow the same pattern as existing provider routes (openai, anthropic)
2. WHEN storing provider settings THEN the System SHALL use the existing profile table structure with new columns
3. WHEN displaying the provider in UI THEN the System SHALL integrate with existing model selection components
