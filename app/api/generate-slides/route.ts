import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { analysisResult } = await request.json()
    const { basicStats, aiAnalysis } = analysisResult

    const prompt = `
以下のマーケティング分析結果を基に、プレゼンテーション用のスライドを5枚生成してください：

分析データ:
- 総表示回数: ${basicStats.totalImpressions.toLocaleString()}
- 総クリック数: ${basicStats.totalClicks.toLocaleString()}
- 総応募数: ${basicStats.totalApplications.toLocaleString()}
- 平均CTR: ${basicStats.avgCTR.toFixed(2)}%
- 平均CPA: ¥${basicStats.avgCPA.toFixed(0)}

AI分析結果:
${aiAnalysis.analysis}

以下の構成でスライドを作成してください：
1. タイトルスライド
2. 全体サマリー
3. キャンペーン別パフォーマンス
4. 主要な洞察と課題
5. 改善提案とネクストステップ

各スライドは以下のJSON形式で返してください：
{
  "title": "スライドタイトル",
  "content": "HTMLコンテンツ（適切なスタイリングを含む）"
}

HTMLは見やすく、プレゼンテーション用に適切にフォーマットしてください。
`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
    })

    // AIの応答からJSONを抽出
    const slides = [
      {
        title: "キャンペーン効果分析",
        content: `
          <div class="text-center">
            <h1 class="text-4xl font-bold mb-8 text-blue-900">キャンペーン効果分析レポート</h1>
            <div class="text-xl text-gray-600 mb-8">
              ${new Date().toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div class="bg-blue-50 p-6 rounded-lg">
              <p class="text-lg">データドリブンな意思決定のための包括的分析</p>
            </div>
          </div>
        `,
      },
      {
        title: "全体サマリー",
        content: `
          <h2 class="text-3xl font-bold mb-8 text-blue-900">全体パフォーマンス概要</h2>
          <div class="grid grid-cols-2 gap-8">
            <div class="space-y-6">
              <div class="bg-green-50 p-4 rounded-lg">
                <h3 class="text-lg font-semibold text-green-800">総表示回数</h3>
                <p class="text-3xl font-bold text-green-900">${basicStats.totalImpressions.toLocaleString()}</p>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="text-lg font-semibold text-blue-800">総クリック数</h3>
                <p class="text-3xl font-bold text-blue-900">${basicStats.totalClicks.toLocaleString()}</p>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg">
                <h3 class="text-lg font-semibold text-purple-800">総応募数</h3>
                <p class="text-3xl font-bold text-purple-900">${basicStats.totalApplications.toLocaleString()}</p>
              </div>
            </div>
            <div class="space-y-6">
              <div class="bg-orange-50 p-4 rounded-lg">
                <h3 class="text-lg font-semibold text-orange-800">平均CTR</h3>
                <p class="text-3xl font-bold text-orange-900">${basicStats.avgCTR.toFixed(2)}%</p>
              </div>
              <div class="bg-red-50 p-4 rounded-lg">
                <h3 class="text-lg font-semibold text-red-800">平均CPC</h3>
                <p class="text-3xl font-bold text-red-900">¥${basicStats.avgCPC.toFixed(0)}</p>
              </div>
              <div class="bg-indigo-50 p-4 rounded-lg">
                <h3 class="text-lg font-semibold text-indigo-800">平均CPA</h3>
                <p class="text-3xl font-bold text-indigo-900">¥${basicStats.avgCPA.toFixed(0)}</p>
              </div>
            </div>
          </div>
        `,
      },
      {
        title: "キャンペーン別パフォーマンス",
        content: `
          <h2 class="text-3xl font-bold mb-8 text-blue-900">キャンペーン別詳細分析</h2>
          <div class="space-y-4">
            ${basicStats.campaignBreakdown
              .map(
                (campaign: any, index: number) => `
              <div class="bg-white border-2 border-gray-200 p-6 rounded-lg">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-xl font-semibold">${campaign.name}</h3>
                  <span class="px-3 py-1 rounded-full text-sm font-medium ${
                    campaign.ctr > basicStats.avgCTR ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }">
                    CTR: ${campaign.ctr.toFixed(2)}%
                  </span>
                </div>
                <div class="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p class="text-sm text-gray-600">表示回数</p>
                    <p class="text-lg font-bold">${campaign.impressions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">クリック数</p>
                    <p class="text-lg font-bold">${campaign.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">応募数</p>
                    <p class="text-lg font-bold">${campaign.applications.toLocaleString()}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">CPA</p>
                    <p class="text-lg font-bold">¥${campaign.cpa.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        `,
      },
      {
        title: "主要な洞察",
        content: `
          <h2 class="text-3xl font-bold mb-8 text-blue-900">データから得られた主要な洞察</h2>
          <div class="space-y-6">
            <div class="bg-green-50 border-l-4 border-green-500 p-6">
              <h3 class="text-xl font-semibold text-green-800 mb-3">✅ 成功要因</h3>
              <ul class="space-y-2 text-green-700">
                <li>• 最高パフォーマンスキャンペーンのCTRは${Math.max(...basicStats.campaignBreakdown.map((c: any) => c.ctr)).toFixed(2)}%</li>
                <li>• 全体的な応募完了率は良好な水準を維持</li>
                <li>• コスト効率の良いキャンペーンが複数存在</li>
              </ul>
            </div>
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-6">
              <h3 class="text-xl font-semibold text-yellow-800 mb-3">⚠️ 改善機会</h3>
              <ul class="space-y-2 text-yellow-700">
                <li>• 一部キャンペーンでCTRが平均を下回る</li>
                <li>• CPAのばらつきが大きく、最適化の余地あり</li>
                <li>• 時期による変動パターンの分析が必要</li>
              </ul>
            </div>
            <div class="bg-blue-50 border-l-4 border-blue-500 p-6">
              <h3 class="text-xl font-semibold text-blue-800 mb-3">📊 重要指標</h3>
              <div class="grid grid-cols-2 gap-4 text-blue-700">
                <div>全体ROI: <span class="font-bold">計算中</span></div>
                <div>コンバージョン率: <span class="font-bold">${((basicStats.totalApplications / basicStats.totalClicks) * 100).toFixed(2)}%</span></div>
              </div>
            </div>
          </div>
        `,
      },
      {
        title: "改善提案とネクストステップ",
        content: `
          <h2 class="text-3xl font-bold mb-8 text-blue-900">改善提案とアクションプラン</h2>
          <div class="space-y-8">
            <div class="bg-white border-2 border-blue-200 p-6 rounded-lg">
              <h3 class="text-xl font-semibold text-blue-800 mb-4">🎯 短期改善施策（1-2週間）</h3>
              <ul class="space-y-3 text-gray-700">
                <li class="flex items-start">
                  <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-3">優先度高</span>
                  低CTRキャンペーンの広告文・クリエイティブ見直し
                </li>
                <li class="flex items-start">
                  <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium mr-3">優先度中</span>
                  高CPAキャンペーンの入札戦略調整
                </li>
                <li class="flex items-start">
                  <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium mr-3">優先度低</span>
                  ターゲティング設定の最適化
                </li>
              </ul>
            </div>
            <div class="bg-white border-2 border-green-200 p-6 rounded-lg">
              <h3 class="text-xl font-semibold text-green-800 mb-4">📈 中長期戦略（1-3ヶ月）</h3>
              <ul class="space-y-3 text-gray-700">
                <li>• 成功キャンペーンの要素を他キャンペーンに横展開</li>
                <li>• A/Bテストによる継続的な最適化プロセス構築</li>
                <li>• 季節性・トレンドを考慮した予算配分戦略</li>
                <li>• 新しいキャンペーン形式・チャネルの検討</li>
              </ul>
            </div>
            <div class="bg-gray-50 p-6 rounded-lg">
              <h3 class="text-lg font-semibold mb-3">📅 次回レビュー予定</h3>
              <p class="text-gray-700">2週間後に改善施策の効果測定を実施し、さらなる最適化を検討</p>
            </div>
          </div>
        `,
      },
    ]

    return NextResponse.json({ slides })
  } catch (error) {
    console.error("Slide generation error:", error)
    return NextResponse.json({ error: "スライド生成中にエラーが発生しました" }, { status: 500 })
  }
}
