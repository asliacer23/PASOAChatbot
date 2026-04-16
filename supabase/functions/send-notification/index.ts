import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  type: "chat_reply" | "announcement" | "system";
  user_id?: string;
  title: string;
  message?: string;
  link?: string;
  broadcast?: boolean; // Send to all users
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: NotificationRequest = await req.json();
    
    // Validate required fields
    if (!body.type || !body.title) {
      throw new Error("Missing required fields: type and title are required");
    }

    console.log("Processing notification request:", body);

    let insertData: any[] = [];

    if (body.broadcast) {
      // Send to all users
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id");
      
      if (usersError) throw usersError;
      
      insertData = (users || []).map((user) => ({
        user_id: user.id,
        type: body.type,
        title: body.title,
        message: body.message || null,
        link: body.link || null,
        is_read: false,
      }));
      
      console.log(`Broadcasting notification to ${insertData.length} users`);
    } else if (body.user_id) {
      // Send to specific user
      insertData = [{
        user_id: body.user_id,
        type: body.type,
        title: body.title,
        message: body.message || null,
        link: body.link || null,
        is_read: false,
      }];
      
      console.log(`Sending notification to user: ${body.user_id}`);
    } else {
      throw new Error("Either user_id or broadcast=true is required");
    }

    // Insert notifications
    const { data, error } = await supabase
      .from("notifications")
      .insert(insertData)
      .select();

    if (error) {
      console.error("Error inserting notifications:", error);
      throw error;
    }

    console.log(`Successfully created ${data?.length || 0} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: data?.length || 0,
        notifications: data 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
