import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const N8N_WEBHOOK_URL = "https://tsp98-keerti.app.n8n.cloud/webhook-test/test-image-gen";

interface SKUQuery {
  query: string;
  source?: string;
  metadata?: {
    platform?: string;
    requestedOutput?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: SKUQuery = await req.json();

    if (!body.query || body.query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Query cannot be empty.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const n8nPayload = {
      query: body.query,
      source: body.source || "bolt_frontend",
      metadata: {
        platform: body.metadata?.platform || "amazon_marketplace",
        requestedOutput: body.metadata?.requestedOutput || "binary_image",
      },
    };

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(n8nPayload),
    });

    const contentType = n8nResponse.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const jsonResponse = await n8nResponse.json();
      return new Response(
        JSON.stringify({
          status: "error",
          message: jsonResponse.errorMessage || "Failed to generate image.",
          query: body.query,
        }),
        {
          status: n8nResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (contentType.includes("image")) {
      const buffer = await n8nResponse.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const mimeType = contentType.split(";")[0].trim();

      return new Response(
        JSON.stringify({
          status: "ok",
          query: body.query,
          imageBase64: `data:${mimeType};base64,${base64}`,
          mimeType: mimeType,
          message: "Here is the generated image for the requested SKU.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "error",
        message: "Unexpected response format from image generator.",
        query: body.query,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Internal server error.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
