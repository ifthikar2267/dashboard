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

/*  CORS HANDLING  */

function corsHeaders(origin) {
  if (!origin) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0] || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

/*   QUESTION ANALYSIS (LLM #1)  */

async function analyzeQuestion(question) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
You are a hotel AI processor.

TASK:
- Fix spelling & grammar.
- Classify intent.
- Normalize words (checkin → check-in, amenitiess → amenities, etc).
- Do NOT change meaning.

OUTPUT FORMAT:
{
  "correctedQuestion": "string",
  "intent": "ATTRACTIONS | AMENITIES | POLICY | FEES | UNKNOWN"
}

Return ONLY valid JSON.
`,
      },
      {
        role: "user",
        content: question,
      },
    ],
  });

  const parsed = response.choices[0].message.content;

  return JSON.parse(parsed);
}

/*  OPTIONS */

export async function OPTIONS(req) {
  const origin = req.headers.get("origin");

  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function POST(req) {
  try {
    const origin = req.headers.get("origin");
    const body = await req.json();

    const { question, hotelId } = body;

    if (!question || !hotelId) {
      return NextResponse.json(
        { error: "Question and hotelId are required" },
        { status: 400 },
      );
    }

    /* STEP 1 — Normalize + Detect Intent (Single LLM Call)  */

    const { correctedQuestion, intent } = await analyzeQuestion(question);

    console.log("Corrected:", correctedQuestion);
    console.log("Intent:", intent);

    /* STEP 2 — Fetch Amenities If Needed  */

    let amenitiesText = "";

    if (intent === "AMENITIES") {
      const { data } = await supabase
        .from("hotel_amenities")
        .select(`amenities(name_en)`)
        .eq("hotel_id", hotelId);

      amenitiesText = data?.length
        ? data.map((a) => `- ${a.amenities?.name_en}`).join("\n")
        : "No amenities found.";

      console.log("Amenities Loaded");
    }

    /* STEP 3 — Embedding   */

    const embeddingQuestion = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: correctedQuestion,
    });

    const embeddedQuestionValue = embeddingQuestion.data[0].embedding;

    /* STEP 4 — Vector Search */

    const vectorResult = await supabase.rpc("match_chunks", {
      query_embedding: embeddedQuestionValue,
      hotel_id_param: hotelId,
      match_threshold: 0.2,
      match_count: 15,
    });

    const matches = vectorResult?.data || [];

    const context = matches.length
      ? matches.map((row) => row.content).join("\n\n")
      : "No relevant data found.";

    console.log("Vector Matches:", matches.length);

    /* STEP 5 — Final LLM Answer (Returns Text)  */

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `
You are an AI Hotel Assistant.

RULES:
- Use only provided context.
- Never invent data.
- Return PLAIN TEXT ONLY.
- DO NOT use markdown.
- Use only the provided context and do not invent data.
- Answer the user’s corrected question clearly and accurately.
- After giving the main answer, generate 3 follow-up questions that are useful for hotel booking or related details.
- After answering, introduce the follow-up 3 questions with a helpful phrase like: ’If you’d like to explore further, here are some related questions you might consider.
- Ensure follow-up questions naturally expand the user’s understanding or help them make better decisions.
- If data is missing, suggest what to ask next to get the needed information.
- Do not use markdown, symbols like # or *, and do not repeat the same question.
- If data not found, return the fallback message.
`,
        },
        {
          role: "user",
          content: `
Corrected Question:
${correctedQuestion}

Intent:
${intent}

Amenities:
${amenitiesText}

Context:
${context}
`,
        },
      ],
    });

    let answer = completion.choices[0].message.content || "";
    console.log("Initial Answer", answer);

    function cleanText(text) {
      if (!text) return "";

      return text
        .replace(/[#*`]/g, "")
        .replace(/^>\s?/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    answer = cleanText(answer);

    console.log("Final Answer:", answer);

    return NextResponse.json(
      {
        answer,
        intent,
        correctedQuestion,
      },
      {
        headers: corsHeaders(origin),
      },
    );
  } catch (error) {
    console.error("Chat API Error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
