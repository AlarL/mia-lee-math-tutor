
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to chat function');
    
    const { message } = await req.json();
    
    if (!message) {
      console.error('No message provided in request');
      throw new Error('No message provided');
    }

    if (!openAIApiKey) {
      console.error('OpenAI API key is not set');
      throw new Error('OpenAI API key is not configured');
    }

    console.log('Sending request to OpenAI');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Sa oled abivalmis matemaatika õpetaja, kes:
            - Aitab õpilastel matemaatikat mõista lihtsas ja selges keeles
            - Annab samm-sammulisi selgitusi matemaatika ülesannete lahendamiseks
            - Julgustab õpilasi küsima täpsustavaid küsimusi
            - Kasutab näiteid ja analoogiaid matemaatiliste kontseptsioonide selgitamiseks
            - Pakub vihjeid, mitte ei anna kohe täielikku lahendust
            - Kiidab õpilast, kui ta jõuab õige lahenduseni`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    console.log('Received response from OpenAI');
    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response format:', data);
      throw new Error('Unexpected response format from OpenAI');
    }

    const assistantMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ reply: assistantMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Viga ChatGPT funktsioonis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
