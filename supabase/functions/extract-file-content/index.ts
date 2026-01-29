import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore - PDF.js for Deno
import * as pdfjsLib from "https://esm.sh/pdfjs-dist@3.11.174/legacy/build/pdf.mjs";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { file_id } = await req.json();

    if (!file_id) {
      throw new Error("file_id is required");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

    // 1. Fetch File Metadata
    const { data: file, error: fetchError } = await supabase
      .from("context_files")
      .select("storage_path, type, name")
      .eq("id", file_id)
      .single();

    if (fetchError || !file) {
      throw new Error("File not found: " + fetchError?.message);
    }

    console.log(`Processing file: ${file.name} (${file.type})`);

    // 2. Download File from Storage
    // Extract just the filename from the full URL path
    const storagePath = file.storage_path.includes('context_files/')
      ? file.storage_path.split('context_files/').pop()
      : file.storage_path;

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("context_files")
      .download(storagePath);

    if (downloadError) {
      throw new Error("Download failed: " + downloadError.message);
    }

    // 3. Extract Text Based on File Type
    let extractedText = "";
    const fileType = file.type?.toLowerCase() || file.name.split('.').pop()?.toLowerCase();

    if (fileType === 'txt' || fileType === 'md') {
      // Plain text files
      extractedText = await fileBlob.text();
      console.log(`Extracted ${extractedText.length} chars from text file`);

    } else if (fileType === 'pdf') {
      // PDF Extraction using PDF.js
      try {
        const arrayBuffer = await fileBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdfDoc = await loadingTask.promise;

        console.log(`PDF has ${pdfDoc.numPages} pages`);

        // Extract text from all pages
        const textParts: string[] = [];
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          textParts.push(pageText);
        }

        extractedText = textParts.join('\n\n--- Página ---\n\n');
        console.log(`Extracted ${extractedText.length} chars from PDF`);

      } catch (pdfError: any) {
        console.error("PDF parsing error:", pdfError);
        extractedText = `[Erro ao processar PDF: ${pdfError.message}]`;
      }

    } else {
      // Unsupported file type
      extractedText = `[Tipo de arquivo não suportado para extração: ${fileType}]`;
    }

    // 4. Truncate if too long (OpenAI context limits)
    const MAX_CHARS = 50000; // ~12k tokens
    if (extractedText.length > MAX_CHARS) {
      extractedText = extractedText.substring(0, MAX_CHARS) + "\n\n[... conteúdo truncado por limite de tamanho ...]";
    }

    // 5. Update Database with Extracted Content
    const { error: updateError } = await supabase
      .from("context_files")
      .update({
        extracted_content: extractedText,
        is_processed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", file_id);

    if (updateError) {
      throw new Error("Failed to update record: " + updateError.message);
    }

    console.log(`Successfully processed file ${file_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        chars_extracted: extractedText.length,
        file_type: fileType
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Extract error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
