import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  userType: 'patient' | 'doctor';
  language?: 'en' | 'ar' | 'fr';
}

const SUPPORTED_LANGUAGES = ['en', 'ar', 'fr'];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userType, language }: RequestBody = await req.json();

    if (!userType || !['patient', 'doctor'].includes(userType)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid user type. Must be "patient" or "doctor".',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const requestedLanguage = SUPPORTED_LANGUAGES.includes(language ?? '') ? language! : 'en';

    // Fetch content in the requested language.
    const { data: localizedContent, error } = await supabase
      .from('app_help_content')
      .select('*')
      .eq('user_type', userType)
      .eq('language', requestedLanguage)
      .order('section', { ascending: true });

    if (error) {
      console.error('Error fetching help content:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch help content',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fall back to English when the requested language has not been authored yet.
    let helpContent = localizedContent || [];
    if (helpContent.length === 0 && requestedLanguage !== 'en') {
      const { data: fallbackContent } = await supabase
        .from('app_help_content')
        .select('*')
        .eq('user_type', userType)
        .eq('language', 'en')
        .order('section', { ascending: true });
      helpContent = fallbackContent || [];
    }

    return new Response(
      JSON.stringify({
        success: true,
        helpContent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in mobile-get-help-content:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
