import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// -----------------------------
// CONFIG
// -----------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -----------------------------
// CHAT ENDPOINT
// -----------------------------
export async function POST(req) {
  try {
    const body = await req.json();
    const question = body.question;
    const hotelId = body.hotelId;

    if (!question || !hotelId) {
      return NextResponse.json(
        { error: "Question and hotelId are required" },
        { status: 400 },
      );
    }

    // 1️⃣ Fetch structured amenities
    const { data: amenitiesData, error: amenitiesError } = await supabase
      .from("hotel_amenities")
      .select(`
        amenity_id,
        amenities(name_en)
      `)
      .eq("hotel_id", hotelId);

    if (amenitiesError) {
      return NextResponse.json(
        { error: amenitiesError.message },
        { status: 500 },
      );
    }

    const amenitiesText = amenitiesData?.length
      ? amenitiesData.map((a) => `- ${a.amenities.name_en}`).join("\n")
      : "No amenities data found";

    // 2️⃣ Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 3️⃣ Vector search
    const { data: matches, error: vectorError } = await supabase.rpc(
      "match_chunks",
      {
        query_embedding: queryEmbedding,
        hotel_id_param: hotelId,
        match_threshold: 0.5,
        match_count: 5,
      },
    );

    if (vectorError) {
      return NextResponse.json(
        { error: vectorError.message },
        { status: 500 },
      );
    }

    const context = matches?.length
      ? matches.map((row) => row.content).join("\n\n")
      : "";

    // 4️⃣ Generate answer
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI Hotel Assistant for Almosafer.",
        },
        {
          role: "user",
          content: `
You are inside the Hotel Detail Page. Use ONLY the hotel data below.

Hotel Data:
${context || "No relevant data found"}

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

    const answer = completion.choices[0].message.content;

    // 5️⃣ Return ONLY answer
    return NextResponse.json({
      answer,
    });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
