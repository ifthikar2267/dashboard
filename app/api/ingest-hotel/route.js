"use server";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST() {
  try {
    // Read JSON file
    const filePath = path.join(process.cwd(), "data", "hotel-content.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);

    const hotels = parsed.hotels;
    if (!Array.isArray(hotels)) {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    // Loop through hotels
    for (const hotel of hotels) {
      const hotelId = hotel.hotelId;
      const sectionsMap = hotel.sectionsMap;
      if (!sectionsMap) continue;

      // Loop through sections
      for (const sectionType of Object.keys(sectionsMap)) {
        const chunks = sectionsMap[sectionType];
        if (!Array.isArray(chunks) || chunks.length === 0) continue;

        // Generate embeddings in bulk for all chunks in this section
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunks, // Pass array of strings for batch embedding
        });

        const embeddings = embeddingResponse.data.map(d => d.embedding);

        // Prepare rows for bulk insert
        const rowsToInsert = chunks.map((content, index) => ({
          hotel_id: hotelId,
          section_type: sectionType,
          chunk_index: index,
          content,
          embedding: embeddings[index],
        }));

        console.log(rowsToInsert);

        // Insert all rows at once
        const { error } = await supabase
          .from("hotel_vector_chunks")
          .insert(rowsToInsert);

        if (error) {
          console.error(`Insert error for hotel ${hotelId}, section ${sectionType}:`, error);
        } else {
          console.log(`Inserted ${rowsToInsert.length} chunks for hotel ${hotelId}, section ${sectionType}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "All hotels ingested successfully with embeddings",
    });
  } catch (err) {
    console.error("Ingestion error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}