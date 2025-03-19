
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

    console.log('Starting OpenAI API call with key length:', openAIApiKey.length);
    console.log('Key prefix:', openAIApiKey.substring(0, 5) + '...');

    try {
      const openai = new OpenAI({
        apiKey: openAIApiKey
      });

      // Kasutame lihtsustatud API kutset ilma lisaparameetriteta
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Kasutame kõige stabiilsemat ja usaldusväärsemat mudelit
        messages: [
          { role: 'user', content: message }
        ],
      });

      console.log('OpenAI API call completed successfully');

      if (!response.choices || !response.choices.length) {
        throw new Error('No choices in OpenAI response');
      }

      const reply = response.choices[0].message.content;
      console.log('Reply generated:', reply.substring(0, 30) + '...');

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (openaiError) {
      console.error('OpenAI API error details:', openaiError);
      console.error('OpenAI API error name:', openaiError.name);
      console.error('OpenAI API error message:', openaiError.message);
      
      if (openaiError.response) {
        console.error('OpenAI API error status:', openaiError.response.status);
        console.error('OpenAI API error data:', openaiError.response.data);
      }
      
      throw new Error(`OpenAI API error: ${openaiError.message}`);
    }
  } catch (error) {
    console.error('General error in chat function:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
