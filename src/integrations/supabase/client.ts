// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://yvvqeldlkufmefwqaueu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnFlbGRsa3VmbWVmd3FhdWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4ODY0NTcsImV4cCI6MjA1NTQ2MjQ1N30.rHBqr16gniQSwxUoWS-5MbyALiItcoRpTw3051Df210";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);