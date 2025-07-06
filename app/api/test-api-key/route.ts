import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json({
        status: "error",
        message: "APIキーが提供されていません",
      })
    }

    // Temporarily set the API key for testing
    const originalApiKey = process.env.OPENAI_API_KEY
    process.env.OPENAI_API_KEY = apiKey.trim()

    try {
      // Test API connection with a simple request
      const { text } = await generateText({
        model: openai("gpt-4o-mini"), // Use mini model for testing to save costs
        prompt: "テスト",
        maxTokens: 5,
      })

      // Restore original API key
      if (originalApiKey) {
        process.env.OPENAI_API_KEY = originalApiKey
      } else {
        delete process.env.OPENAI_API_KEY
      }

      return NextResponse.json({
        status: "valid",
        message: "APIキーが有効です。AI機能を使用できます。",
        test: text,
      })
    } catch (error: any) {
      // Restore original API key
      if (originalApiKey) {
        process.env.OPENAI_API_KEY = originalApiKey
      } else {
        delete process.env.OPENAI_API_KEY
      }

      console.error("API key test error:", error)

      // Check for specific error types
      if (error.message?.includes("API key") || error.message?.includes("Unauthorized")) {
        return NextResponse.json({
          status: "invalid",
          message: "無効なAPIキーです。正しいAPIキーを入力してください。",
        })
      }

      if (error.message?.includes("quota") || error.message?.includes("exceeded")) {
        return NextResponse.json({
          status: "quota_exceeded",
          message: "API使用量の上限に達しています。OpenAI Platformで使用量を確認してください。",
        })
      }

      if (error.message?.includes("rate limit")) {
        return NextResponse.json({
          status: "rate_limited",
          message: "レート制限に達しています。しばらく待ってから再試行してください。",
        })
      }

      return NextResponse.json({
        status: "error",
        message: `APIキーのテストに失敗しました: ${error.message}`,
      })
    }
  } catch (error) {
    console.error("Request processing error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "リクエストの処理中にエラーが発生しました",
      },
      { status: 500 },
    )
  }
}
