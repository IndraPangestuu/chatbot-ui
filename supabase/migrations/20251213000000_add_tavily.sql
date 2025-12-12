-- Add Tavily API key column to profiles table for web search functionality
ALTER TABLE profiles
ADD COLUMN tavily_api_key TEXT CHECK (char_length(tavily_api_key) <= 1000);

-- Update the create_profile_and_workspace function to include tavily_api_key
CREATE OR REPLACE FUNCTION create_profile_and_workspace() 
RETURNS TRIGGER
security definer set search_path = public
AS $$
DECLARE
    random_username TEXT;
BEGIN
    -- Generate a random username
    random_username := 'user' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);

    -- Create a profile for the new user
    INSERT INTO public.profiles(
        user_id,
        anthropic_api_key,
        azure_openai_35_turbo_id,
        azure_openai_45_turbo_id,
        azure_openai_45_vision_id,
        azure_openai_api_key,
        azure_openai_endpoint,
        google_gemini_api_key,
        has_onboarded,
        image_url,
        image_path,
        mistral_api_key,
        display_name,
        bio,
        openai_api_key,
        openai_organization_id,
        perplexity_api_key,
        profile_context,
        use_azure_openai,
        username,
        openai_compatible_api_key,
        openai_compatible_base_url,
        openai_compatible_model_name,
        tavily_api_key
    )
    VALUES(
        NEW.id,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        FALSE,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        FALSE,
        random_username,
        '',
        '',
        '',
        ''
    );

    -- Create the home workspace for the new user
    INSERT INTO public.workspaces(
        user_id,
        is_home,
        name,
        default_context_length,
        default_model,
        default_prompt,
        default_temperature,
        description,
        embeddings_provider,
        include_profile_context,
        include_workspace_instructions,
        instructions
    )
    VALUES(
        NEW.id,
        TRUE,
        'Home',
        4096,
        'gpt-4-1106-preview',
        'You are a friendly, helpful AI assistant.',
        0.5,
        'My home workspace.',
        'openai',
        TRUE,
        TRUE,
        ''
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
