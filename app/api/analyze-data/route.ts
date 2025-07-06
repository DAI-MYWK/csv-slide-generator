import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { stats, campaigns, dailyData } = await request.json()

    const prompt = `
以下のマーケティングキャンペーンデータを分析してください：

基本統計:
- 総表示回数: ${stats.totalImpressions.toLocaleString()}
- 総クリック数: ${stats.totalClicks.toLocaleString()}
- 総応募数: ${stats.totalApplications.toLocaleString()}
- 総費用: ¥${stats.totalCost.toLocaleString()}
- 平均CTR: ${stats.avgCTR.toFixed(2)}%
- 平均CPC: ¥${stats.avgCPC.toFixed(0)}
- 平均CPA: ¥${stats.avgCPA.toFixed(0)}

キャンペーン別データ:
${stats.campaignBreakdown
  .map(
    (c: any) =>
      `- ${c.name}: 表示回数${c.impressions.toLocaleString()}, CTR${c.ctr.toFixed(2)}%, CPA¥${c.cpa.toFixed(0)}`,
  )
  .join("\n")}

以下の観点で分析してください：
1. 全体的なパフォーマンス評価
2. 最も効果的なキャンペーンの特定
3. 改善が必要な領域
4. コスト効率性の評価
5. 具体的な改善提案

日本語で詳細な分析結果を提供してください。
`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
    })

    return NextResponse.json({
      analysis: text,
      insights: {
        topPerformingCampaign: stats.campaignBreakdown.reduce((best: any, current: any) =>
          current.ctr > best.ctr ? current : best,
        ),
        worstPerformingCampaign: stats.campaignBreakdown.reduce((worst: any, current: any) =>
          current.ctr < worst.ctr ? current : worst,
        ),
        costEfficiency: stats.avgCPA < 1000 ? "excellent" : stats.avgCPA < 2000 ? "good" : "needs_improvement",
      },
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "データ分析中にエラーが発生しました" }, { status: 500 })
  }
}
