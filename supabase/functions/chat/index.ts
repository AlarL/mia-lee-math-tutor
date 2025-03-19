
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.20.1";

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
    console.log('Received message:', message);

    if (!message) {
      throw new Error('No message provided');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    // Lihtsustame OpenAI API kutset veelgi
    try {
      const openai = new OpenAI({
        apiKey: openAIApiKey
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Kasutame väiksemat mudelit kiirema vastuse jaoks
        messages: [
          {
            role: 'system',
            content: 'Sa oled matemaatika õpetaja. Vasta lühidalt ja selgelt eesti keeles. Sinu eesmärk on aidata õpilasi matemaatika ülesannetega.'
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      console.log('OpenAI response status:', 'success');

      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Unexpected response format from OpenAI');
      }

      const reply = response.choices[0].message.content;
      console.log('Generated reply:', reply.substring(0, 50) + '...');

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      throw new Error(`OpenAI API viga: ${openaiError.message}`);
    }
  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
