
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

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

    const data = await response.json();
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
