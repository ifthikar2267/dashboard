import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0] || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function normalizeUserQuestion(question) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
You correct spelling and grammar mistakes.

Rules:
- Fix words like: checkin → check-in
- amenitiess → amenities
- attractionss → attractions
- poii / poi → attractions
- fix small typos
- Do NOT change meaning.
Return ONLY corrected question.
`,
      },
      {
        role: "user",
        content: question,
      },
    ],
  });

  return response.choices[0].message.content.trim();
}

async function detectIntent(question) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
Classify hotel question.

Return ONLY one word:

ATTRACTIONS
AMENITIES
POLICY
FEES
UNKNOWN
`,
      },
      {
        role: "user",
        content: question,
      },
    ],
  });

  return response.choices[0].message.content.trim();
}

export async function OPTIONS(req) {
  const origin = req.headers.get("origin");

  if (allowedOrigins.includes(origin)) {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  return new Response(null, { status: 403 });
}

export async function POST(req) {
  try {
    const origin = req.headers.get("origin");
    const body = await req.json();

    let { question, hotelId } = body;

    if (!question || !hotelId) {
      return NextResponse.json(
        { error: "Question and hotelId are required" },
        { status: 400 },
      );
    }

    // STEP 1 — Normalize Question

    const correctedQuestion = await normalizeUserQuestion(question);

    console.log("Original Question:", question);
    console.log("Corrected Question:", correctedQuestion);

    // STEP 2 — Detect Intent

    const intent = await detectIntent(correctedQuestion);

    console.log("Intent:", intent);

    //  STEP 3 — Fetch Amenities

    let amenitiesText = "";

    if (intent === "AMENITIES") {
      const { data } = await supabase
        .from("hotel_amenities")
        .select(`amenities(name_en)`)
        .eq("hotel_id", hotelId);

      amenitiesText = data?.length
        ? data.map((a) => `- ${a.amenities?.name_en}`).join("\n")
        : "No amenities found.";

      console.log("Amenities Data:", data);
    }

    //  STEP 4 — Embedding Generation

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: correctedQuestion,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    console.log("Embedding Length:", queryEmbedding.length);
    console.log("Embedding Sample:", queryEmbedding.slice(0, 10));

    // STEP 5 — Vector Search

    console.log("Calling match_chunks RPC...");

    const vectorResult = await supabase.rpc("match_chunks", {
      query_embedding: queryEmbedding,
      hotel_id_param: hotelId,
      match_threshold: 0.2,
      match_count: 15,
    });

    const matches = vectorResult?.data || [];

    console.log("Raw Vector Result:", vectorResult);
    console.log(" Matches Found:", matches.length);

    if (matches.length > 0) {
      matches.forEach((match, index) => {
        console.log(`Match #${index + 1}`);
        console.log("Score:", match.similarity);
        console.log("Section:", match.section);
        console.log("Preview:", match.content.slice(0, 200));
      });
    }

    const context = matches.length
      ? matches.map((row) => row.content).join("\n\n")
      : "No relevant data found.";

    console.log("Final Context Sent To LLM:", context.slice(0, 500));

    //  STEP 6 — Generate Final Answer

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `
You are an AI Hotel Assistant.

Rules:
- Use only provided context.
- If data not found, say: "No matching information found."
- Use proper section names.
- Never invent data.
`,
        },
        {
          role: "user",
          content: `
Corrected Question:
${correctedQuestion}

Intent:
${intent}

Hotel Amenities:
${amenitiesText}

Hotel Data Context:
${context}
`,
        },
      ],
    });

    const answer = completion.choices[0].message.content;

    return NextResponse.json(
      {
        answer,
        intent,
        correctedQuestion,
      },
      { headers: corsHeaders(origin) },
    );
  } catch (err) {
    console.error("Chat API Error:", err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
