
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.20.1";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const ASSISTANT_ID = "asst_abc123"; // This will be replaced with the actual Assistant ID

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

    const openai = new OpenAI({
      apiKey: openAIApiKey
    });

    // Create a thread
    const thread = await openai.beta.threads.create();
    console.log('Created thread:', thread.id);

    // Add the message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    });

    // Run the Assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    // Wait for the completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    // Poll until the run is completed
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log('Run status:', runStatus.status);
    }

    // Get the messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];

    if (!lastMessage || !lastMessage.content[0]) {
      throw new Error('No response from assistant');
    }

    const reply = lastMessage.content[0].text.value;
    console.log('Assistant reply:', reply);

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
