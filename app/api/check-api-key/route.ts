import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function GET() {
  try {
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        status: "missing",
        message: "OPENAI_API_KEY environment variable is not set",
      })
    }

    // Test API connection with a simple request
    const { text } = await generateText({
      model: openai("gpt-4o-mini"), // Use mini model for testing to save costs
      prompt: "Hello",
      maxTokens: 5,
    })

    return NextResponse.json({
      status: "valid",
      message: "OpenAI API key is valid and working",
      test: text,
    })
  } catch (error: any) {
    console.error("API key validation error:", error)

    // Check for specific error types
    if (error.message?.includes("API key")) {
      return NextResponse.json({
        status: "invalid",
        message: "Invalid API key provided",
      })
    }

    if (error.message?.includes("quota")) {
      return NextResponse.json({
        status: "quota_exceeded",
        message: "API quota exceeded",
      })
    }

    return NextResponse.json({
      status: "invalid",
      message: "Failed to validate API key",
    })
  }
}
