import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://luicvxrynmmuuzvltacb.supabase.co/rest/v1/";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWN2eHJ5bm1tdXV6dmx0YWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MjU4NjEsImV4cCI6MjEwNjIwMTg2MX0.2jANNhymWw65uVqp90ERhaMOqR46XKkzhwwgth3fckY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
