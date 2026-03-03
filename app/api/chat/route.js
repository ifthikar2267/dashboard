import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ===============================
// CONFIG
// ===============================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Read allowed origins from .env
const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(",") || [];

// ===============================
// CORS HELPERS
// ===============================

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin":
      allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// ===============================
// ✅ HANDLE PREFLIGHT (CORS)
// ===============================

export async function OPTIONS(req) {
  const origin = req.headers.get("origin");

  if (allowedOrigins.includes(origin)) {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  return new Response(null, {
    status: 403,
  });
}

// ===============================
// ✅ CHAT ENDPOINT
// ===============================

export async function POST(req) {
  try {
    const origin = req.headers.get("origin");

    const body = await req.json();
    const question = body.question;
    const hotelId = body.hotelId;

    if (!question || !hotelId) {
      return NextResponse.json(
        { error: "Question and hotelId are required" },
        { status: 400 }
      );
    }

    // =====================================
    // 1️⃣ Fetch Amenities
    // =====================================

    const { data: amenitiesData, error: amenitiesError } =
      await supabase
        .from("hotel_amenities")
        .select(`
          amenity_id,
          amenities(name_en)
        `)
        .eq("hotel_id", hotelId);

    if (amenitiesError) {
      return NextResponse.json(
        { error: amenitiesError.message },
        { status: 500 }
      );
    }

    const amenitiesText = amenitiesData?.length
      ? amenitiesData
          .map((a) => `- ${a.amenities?.name_en}`)
          .join("\n")
      : "No amenities data found";

    // =====================================
    // 2️⃣ Generate Embedding
    // =====================================

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    const queryEmbedding =
      embeddingResponse.data[0].embedding;

    // =====================================
    // 3️⃣ Vector Search
    // =====================================

    const { data: matches, error: vectorError } =
      await supabase.rpc("match_chunks", {
        query_embedding: queryEmbedding,
        hotel_id_param: hotelId,
        match_threshold: 0.5,
        match_count: 5,
      });

    if (vectorError) {
      return NextResponse.json(
        { error: vectorError.message },
        { status: 500 }
      );
    }

    const context = matches?.length
      ? matches.map((row) => row.content).join("\n\n")
      : "No relevant data found";

    // =====================================
    // 4️⃣ Generate AI Answer
    // =====================================

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an AI Hotel Assistant for Almosafer. Answer only using provided hotel data.",
          },
          {
            role: "user",
            content: `
            Hotel Data:
            ${context}

            Hotel Amenities:
            ${amenitiesText}

            User Question:
            ${question}
            `,
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      });

    const answer =
      completion.choices[0].message.content;

    // =====================================
    // 5️⃣ Return Response With CORS
    // =====================================

    return NextResponse.json(
      { answer },
      {
        headers: corsHeaders(origin),
      }
    );
  } catch (err) {
    console.error("Chat error:", err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}