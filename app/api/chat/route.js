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

//normalize
function normalizeSemantics(question) {
  const map = {
    poi: "attraction",
    "points of interest": "attraction",
    lift: "elevator",
    wifi: "internet",
    spa: "wellness/spa",
    "check in": "check-in",
    "check out": "check-out",
  };

  let q = question.toLowerCase();
  for (const key in map) {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    q = q.replace(regex, map[key]);
  }

  return q;
}

/*  Simple local intent detection to skip LLM #1 */
function detectIntent(question) {
  const q = question.toLowerCase();
  if (q.includes("amenities") || q.includes("gym") || q.includes("pool") || q.includes("spa") || q.includes("wifi") || q.includes("parking") || q.includes("non-smoking") || q.includes("lifts"))
    return "AMENITIES";
  if (q.includes("attraction") || q.includes("nearby") || q.includes("distance") || q.includes("poi"))
    return "ATTRACTIONS";
  if (q.includes("check-in") || q.includes("check out") || q.includes("policy"))
    return "POLICY";
  if (q.includes("fee") || q.includes("tax") || q.includes("charge"))
    return "FEES";
  return "UNKNOWN";
}

// Follow up related questions
// structured DB questions
const AMENITIES_QUESTIONS = [
  "What amenities are available at this hotel?",
  "Is a gym available at this hotel?",
  "Is there a pool at this hotel?",
  "Does the hotel have a spa?",
];

// unstructured DB questions
const OTHER_QUESTIONS = [
  "What are the top 5 attractions near this hotel?",
  "What are the check-in and check-out times for this property?",
  "Which airports are closest to this property?",
  "Is there a fee for using the airport shuttle service?",
  "What mandatory fees are required when staying at this property?",
];

// Helper to get random element from array
function getRandomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Pick one from each category
function getRandomFollowUps() {
  const first = getRandomFromArray(AMENITIES_QUESTIONS);
  const second = getRandomFromArray(OTHER_QUESTIONS);
  return [first, second];
}

export async function OPTIONS(req) {
  const origin = req.headers.get("origin");
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req) {
  try {
    const origin = req.headers.get("origin");
    const body = await req.json();
    const { question, hotelId } = body;

    if (!question || !hotelId) {
      return NextResponse.json({ error: "Question and hotelId are required" }, { status: 400 });
    }

    /* STEP 1 — Skip LLM, use local intent detection */
    const correctedQuestion = normalizeSemantics(question);
    const intent = detectIntent(question);

    /* STEP 2 — Fetch amenities and embedding in parallel */
    const amenitiesPromise =
      intent === "AMENITIES"
        ? supabase.from("hotel_amenities").select(`amenities(name_en)`).eq("hotel_id", hotelId)
        : Promise.resolve({ data: [] });

    const embeddingPromise = openai.embeddings.create({
      model: "text-embedding-3-small",
      input: correctedQuestion,
    });

    const [amenitiesResult, embeddingResult] = await Promise.all([amenitiesPromise, embeddingPromise]);

    let amenitiesText = "";
    if (intent === "AMENITIES") {
      const data = amenitiesResult.data;
      amenitiesText = data?.length
        ? data.map((a) => `- ${a.amenities?.name_en}`).join("\n")
        : "No amenities found.";
    }

    const embeddedQuestionValue = embeddingResult.data[0].embedding;

    /* STEP 3 — Vector search (limit results for faster LLM) */
    const vectorResult = await supabase.rpc("match_chunks", {
      query_embedding: embeddedQuestionValue,
      hotel_id_param: hotelId,
      match_threshold: 0.2,
      match_count: 8,
    });

    const matches = vectorResult?.data || [];
    const context = matches.length
      ? matches.map((row) => row.content).join("\n\n")
      : "No relevant data found.";

    /* STEP 4 — Final LLM call with reduced tokens */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 200, // smaller token count
      messages: [
        {
          role: "system",
          content: `
You are an AI Hotel Assistant.

RULES:
1. Use only the provided database context.
2. Do not invent data.
3. Answer the corrected question clearly and accurately.
4. If data is not found, return the fallback message.
5. After the main answer, generate exactly 2 follow-up questions.
6. Follow-up questions must be directly related to the available data sections:
- Attractions and distances
- Airports and transportation
- Property policies
- Check in and check out
- Fees and taxes
- Amenities
7. Follow-up questions must be derived from information present in the context.
8. Do not generate unrelated questions like booking confirmation or payment unless that information exists in the context.
9. Do not repeat the same question.
10. Do not use markdown, symbols, special formatting, or headings.
11. Do not use #, *, **, ### or similar formatting.

After answering, add this line:

Related questions:

Then list exactly 2 follow-up questions.
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
    // Generate follow-ups
const followUps = getRandomFollowUps();

// Remove any old Related questions section
answer = answer.replace(/related questions\s*:[\s\S]*/i, "").trim();

// Append follow-ups properly formatted for frontend parsing
answer += "\nRelated questions:\n" + followUps.map(q => `- ${q}`).join("\n");

// Clean the answer
function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/[#*`]/g, "")
    .replace(/^>\s?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

answer = cleanText(answer);

    return NextResponse.json({ answer, intent, correctedQuestion }, { headers: corsHeaders(origin) });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}