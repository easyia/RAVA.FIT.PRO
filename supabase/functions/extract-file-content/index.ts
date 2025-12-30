import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  try {
    const { file_id } = await req.json();
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

    // 1. Fetch File Metadata
    const { data: file } = await supabase
      .from("context_files")
      .select("storage_path, type")
      .eq("id", file_id)
      .single();

    if (!file) throw new Error("File not found");

    // 2. Download File
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("context_files")
      .download(file.storage_path);

    if (downloadError) throw downloadError;

    // 3. Extract Text (Simplified placeholder)
    // In a real scenario, use libraries like pdf-parse
    let extractedText = "";
    if (file.type === 'txt' || file.type === 'md') {
      extractedText = await fileBlob.text();
    } else {
      extractedText = "[Conteúdo binário ou PDF não processado neste MVP]";
    }

    // 4. Update Database
    await supabase
      .from("context_files")
      .update({
        extracted_content: extractedText,
        is_processed: true,
      })
      .eq("id", file_id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
