import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

export async function POST(request: Request) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    // Here you would integrate with an OCR service like Google Cloud Vision,
    // Azure Computer Vision, or Tesseract.js to extract text from the image

    // For demo purposes, we'll simulate OCR extraction with a delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // This is where you would parse the OCR results to extract transaction details
    // For this example, we'll return mock data
    const extractedData = {
      date: new Date().toISOString().split("T")[0],
      description: "Coffee Shop Purchase",
      amount: "-4.99",
      category: "food",
      // Get the first card from the user's cards
      card_id: "",
    }

    // Get the first card for the user
    const { data: cards } = await supabase.from("cards").select("id").limit(1)

    if (cards && cards.length > 0) {
      extractedData.card_id = cards[0].id
    }

    return NextResponse.json(extractedData)
  } catch (error) {
    console.error("Error processing receipt:", error)
    return NextResponse.json({ error: "Failed to process receipt" }, { status: 500 })
  }
}

