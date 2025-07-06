import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { analysisResult } = await request.json()
    const { basicStats } = analysisResult

    // 汎用的な3枚のスライドを生成
    const slides = [
      {
        title: `全体効果: 月次 (${basicStats.periodInfo.analysisTitle})`,
        content: generateMonthlySlide(basicStats),
      },
      {
        title: `全体効果: 週次 (${basicStats.periodInfo.analysisTitle})`,
        content: generateWeeklySlide(basicStats),
      },
      {
        title: `全体効果: キャンペーンごと (${basicStats.periodInfo.analysisTitle}) ※全体着地`,
        content: generateCampaignSlide(basicStats),
      },
    ]

    return NextResponse.json({ slides })
  } catch (error) {
    console.error("Slide generation error:", error)
    return NextResponse.json({ error: "スライド生成中にエラーが発生しました" }, { status: 500 })
  }
}

function generateMonthlySlide(basicStats: any) {
  const { monthlyData, periodInfo } = basicStats

  // 主要月と基準月のデータを取得
  const mainMonthData = monthlyData.find((m: any) => m.monthKey === periodInfo.mainMonth) || monthlyData[0]
  const baseMonthData = monthlyData.find((m: any) => m.monthKey === periodInfo.baseMonth)
  
  // 基準月のデータが存在しない場合、主要月の前の月のデータを使用
  let effectiveBaseMonthData = baseMonthData
  if (!effectiveBaseMonthData) {
    const monthlyDataSorted = monthlyData.sort((a: any, b: any) => a.monthKey.localeCompare(b.monthKey))
    const mainIndex = monthlyDataSorted.findIndex((m: any) => m.monthKey === periodInfo.mainMonth)
    
    if (mainIndex > 0) {
      effectiveBaseMonthData = monthlyDataSorted[mainIndex - 1]
    } else {
      // 前月のデータがない場合、ダミーデータを作成
      const baseMonthNum = periodInfo.baseMonth.split("-")[1]
      effectiveBaseMonthData = {
        period: `${baseMonthNum}月`,
        monthKey: periodInfo.baseMonth,
        impressions: 0,
        clicks: 0,
        applications: 0,
        applicationStarts: 0,
        cost: 0,
        ctr: 0,
        asr: 0,
        completionRate: 0,
        ar: 0,
        cpc: 0,
        cpas: 0,
        cpa: 0,
      }
    }
  }

  // 前月比の計算
  const calculateDiff = (main: number, base: number, isPercentage = false, isPrice = false) => {
    const diff = main - base
    const sign = diff >= 0 ? "+" : ""
    const unit = isPercentage ? "pt" : ""
    const value = isPrice ? Math.round(diff) : diff
    return `${sign}${value.toLocaleString()}${unit}`
  }

  return `
    <div class="p-8 bg-white min-h-screen">
      <h1 class="text-3xl font-bold mb-8 text-center text-blue-900">全体効果: 月次 (${periodInfo.analysisTitle})</h1>
      
      <!-- テーブル1: 主要月のパフォーマンス（着地） -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4 bg-blue-100 p-3 rounded">▼${mainMonthData.period}度: 着地</h2>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse border border-gray-300 text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-gray-300 p-2">期間</th>
                <th class="border border-gray-300 p-2">表示回数</th>
                <th class="border border-gray-300 p-2">クリック率</th>
                <th class="border border-gray-300 p-2">クリック数</th>
                <th class="border border-gray-300 p-2">応募開始率</th>
                <th class="border border-gray-300 p-2">応募開始数</th>
                <th class="border border-gray-300 p-2">応募完了率</th>
                <th class="border border-gray-300 p-2">応募数</th>
                <th class="border border-gray-300 p-2">応募率</th>
                <th class="border border-gray-300 p-2">費用</th>
                <th class="border border-gray-300 p-2">クリック単価</th>
                <th class="border border-gray-300 p-2">応募開始単価</th>
                <th class="border border-gray-300 p-2">応募単価</th>
              </tr>
            </thead>
            <tbody>
              <tr class="bg-yellow-50">
                <td class="border border-gray-300 p-2 font-medium">${mainMonthData.period}</td>
                <td class="border border-gray-300 p-2">${mainMonthData.impressions.toLocaleString()}</td>
                <td class="border border-gray-300 p-2">${mainMonthData.ctr.toFixed(2)}%</td>
                <td class="border border-gray-300 p-2">${mainMonthData.clicks.toLocaleString()}</td>
                <td class="border border-gray-300 p-2">${mainMonthData.asr.toFixed(2)}%</td>
                <td class="border border-gray-300 p-2">${mainMonthData.applicationStarts.toLocaleString()}</td>
                <td class="border border-gray-300 p-2">${mainMonthData.completionRate.toFixed(2)}%</td>
                <td class="border border-gray-300 p-2">${mainMonthData.applications.toLocaleString()}</td>
                <td class="border border-gray-300 p-2">${mainMonthData.ar.toFixed(2)}%</td>
                <td class="border border-gray-300 p-2">¥${mainMonthData.cost.toLocaleString()}</td>
                <td class="border border-gray-300 p-2">¥${mainMonthData.cpc.toFixed(0)}</td>
                <td class="border border-gray-300 p-2">¥${mainMonthData.cpas.toFixed(0)}</td>
                <td class="border border-gray-300 p-2">¥${mainMonthData.cpa.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- テーブル2: 複数月のパフォーマンス推移 -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">▼期間別推移 (${periodInfo.analysisTitle})</h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse border border-gray-300 text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-gray-300 p-2">期間</th>
                <th class="border border-gray-300 p-2">表示回数</th>
                <th class="border border-gray-300 p-2">クリック率</th>
                <th class="border border-gray-300 p-2">クリック数</th>
                <th class="border border-gray-300 p-2">応募開始率</th>
                <th class="border border-gray-300 p-2">応募開始数</th>
                <th class="border border-gray-300 p-2">応募完了率</th>
                <th class="border border-gray-300 p-2">応募数</th>
                <th class="border border-gray-300 p-2">応募率</th>
                <th class="border border-gray-300 p-2">費用</th>
                <th class="border border-gray-300 p-2">クリック単価</th>
                <th class="border border-gray-300 p-2">応募開始単価</th>
                <th class="border border-gray-300 p-2">応募単価</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyData
                .map(
                  (month: any, index: number) => `
                <tr class="${month.monthKey === periodInfo.mainMonth ? "bg-yellow-50" : index % 2 === 0 ? "bg-gray-50" : "bg-white"}">
                  <td class="border border-gray-300 p-2 font-medium">${month.period}</td>
                  <td class="border border-gray-300 p-2">${month.impressions.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">${month.ctr.toFixed(2)}%</td>
                  <td class="border border-gray-300 p-2">${month.clicks.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">${month.asr.toFixed(2)}%</td>
                  <td class="border border-gray-300 p-2">${month.applicationStarts.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">${month.completionRate.toFixed(2)}%</td>
                  <td class="border border-gray-300 p-2">${month.applications.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">${month.ar.toFixed(2)}%</td>
                  <td class="border border-gray-300 p-2">¥${month.cost.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">¥${month.cpc.toFixed(0)}</td>
                  <td class="border border-gray-300 p-2">¥${month.cpas.toFixed(0)}</td>
                  <td class="border border-gray-300 p-2">¥${month.cpa.toFixed(0)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- テーブル3: 前月比 -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4 bg-blue-50 p-3 rounded">▼前月比 (${effectiveBaseMonthData.period}: ${mainMonthData.period})</h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse border border-gray-300 text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-gray-300 p-2">表示回数</th>
                <th class="border border-gray-300 p-2">クリック率</th>
                <th class="border border-gray-300 p-2">クリック数</th>
                <th class="border border-gray-300 p-2">応募開始率</th>
                <th class="border border-gray-300 p-2">応募開始数</th>
                <th class="border border-gray-300 p-2">応募完了率</th>
                <th class="border border-gray-300 p-2">応募数</th>
                <th class="border border-gray-300 p-2">応募率</th>
                <th class="border border-gray-300 p-2">費用</th>
                <th class="border border-gray-300 p-2">クリック単価</th>
                <th class="border border-gray-300 p-2">応募開始単価</th>
                <th class="border border-gray-300 p-2">応募単価</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 p-2 font-medium ${mainMonthData.impressions - effectiveBaseMonthData.impressions >= 0 ? "text-green-600" : "text-red-600"}">${calculateDiff(mainMonthData.impressions, effectiveBaseMonthData.impressions)}</td>
                <td class="border border-gray-300 p-2 font-medium ${mainMonthData.ctr - effectiveBaseMonthData.ctr >= 0 ? "text-green-600" : "text-red-600"}">${calculateDiff(mainMonthData.ctr, effectiveBaseMonthData.ctr, true)}</td>
                <td class="border border-gray-300 p-2 font-medium ${mainMonthData.clicks - effectiveBaseMonthData.clicks >= 0 ? "text-green-600" : "text-red-600"}">${calculateDiff(mainMonthData.clicks, effectiveBaseMonthData.clicks)}</td>
                <td class="border border-gray-300 p-2 font-medium ${mainMonthData.asr - effectiveBaseMonthData.asr >= 0 ? "text-green-600" : "text-red-600"}">${calculateDiff(mainMonthData.asr, effectiveBaseMonthData.asr, true)}</td>
                <td class="border border-gray-300 p-2 font-medium ${mainMonthData.applicationStarts - effectiveBaseMonthData.applicationStarts >= 0 ? "text-green-600" : "text-red-600"}">${calculateDiff(mainMonthData.applicationStarts, effectiveBaseMonthData.applicationStarts)}</td>
                <td class="border border-gray-300 p-2 font-medium ${mainMonthData.completionRate - effectiveBaseMonthData.completionRate >= 0 ? "text-green-600" : "text-red-600"}">${calculateDiff(mainMonthData.completionRate, effectiveBaseMonthData.completionRate)}%</td>
                <td class="border border-gray-300 p-2 font-medium ${mainMonthData.applications - effectiveBaseMonthData.applications >= 0 ? "text-green-600" : "text-red-600"}">${calculateDiff(mainMonthData.applications, effectiveBaseMonthData.applications)}</td>
                <td class="border border-gray-300 p-2 font-medium ${mainMonthData.ar - effectiveBaseMonthData.ar >= 0 ? "text-green-600" : "text-red-600"}">${calculateDiff(mainMonthData.ar, effectiveBaseMonthData.ar, true)}</td>
                <td class="border border-gray-300 p-2 font-medium ${mainMonthData.cost - effectiveBaseMonthData.cost >= 0 ? "text-red-600" : "text-green-600"}">${calculateDiff(mainMonthData.cost, effectiveBaseMonthData.cost)}</td>
                <td class="border border-gray-300 p-2 font-medium ${mainMonthData.cpc - effectiveBaseMonthData.cpc >= 0 ? "text-red-600" : "text-green-600"}">¥${calculateDiff(mainMonthData.cpc, effectiveBaseMonthData.cpc, false, true)}</td>
                <td class="border border-gray-300 p-2 font-medium ${mainMonthData.cpas - effectiveBaseMonthData.cpas >= 0 ? "text-red-600" : "text-green-600"}">¥${calculateDiff(mainMonthData.cpas, effectiveBaseMonthData.cpas, false, true)}</td>
                <td class="border border-gray-300 p-2 font-medium ${mainMonthData.cpa - effectiveBaseMonthData.cpa >= 0 ? "text-red-600" : "text-green-600"}">¥${calculateDiff(mainMonthData.cpa, effectiveBaseMonthData.cpa, false, true)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- テキストエリア: 結果・考察 -->
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="text-lg font-semibold mb-4">＜結果＞</h3>
        <div class="space-y-4 text-sm">
          <div class="bg-white p-4 rounded border-l-4 border-blue-500">
            <h4 class="font-medium text-blue-800 mb-2">主要な成果</h4>
            <ul class="space-y-1 text-gray-700">
              <li>• ${mainMonthData.period}の総表示回数: ${mainMonthData.impressions.toLocaleString()}</li>
              <li>• クリック率: ${mainMonthData.ctr.toFixed(2)}%</li>
              <li>• 応募完了率: ${mainMonthData.completionRate.toFixed(2)}%</li>
              <li>• 応募単価: ¥${mainMonthData.cpa.toFixed(0)}</li>
            </ul>
          </div>
          <div class="bg-white p-4 rounded border-l-4 border-green-500">
            <h4 class="font-medium text-green-800 mb-2">前月比での改善点</h4>
            <p class="text-gray-700">
              ${mainMonthData.impressions - effectiveBaseMonthData.impressions >= 0 ? "表示回数が増加し、" : ""}
              ${mainMonthData.ctr - effectiveBaseMonthData.ctr >= 0 ? "クリック率が向上し、" : ""}
              ${mainMonthData.ar - effectiveBaseMonthData.ar >= 0 ? "応募率が改善されました。" : ""}
            </p>
          </div>
          <div class="bg-white p-4 rounded border-l-4 border-yellow-500">
            <h4 class="font-medium text-yellow-800 mb-2">今後のアクション</h4>
            <p class="text-gray-700">
              継続的な最適化により、さらなるパフォーマンス向上を目指します。
            </p>
          </div>
        </div>
      </div>
    </div>
  `
}

function generateWeeklySlide(basicStats: any) {
  const { weeklyData, periodInfo } = basicStats

  return `
    <div class="p-8 bg-white min-h-screen">
      <h1 class="text-3xl font-bold mb-8 text-center text-blue-900">全体効果: 週次 (${periodInfo.analysisTitle})</h1>
      
      <!-- 週次データテーブル -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">週次パフォーマンス一覧</h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse border border-gray-300 text-xs">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-gray-300 p-2">期間</th>
                <th class="border border-gray-300 p-2">表示回数</th>
                <th class="border border-gray-300 p-2">クリック率</th>
                <th class="border border-gray-300 p-2">クリック数</th>
                <th class="border border-gray-300 p-2">応募開始率</th>
                <th class="border border-gray-300 p-2">応募開始数</th>
                <th class="border border-gray-300 p-2">応募完了率</th>
                <th class="border border-gray-300 p-2">応募数</th>
                <th class="border border-gray-300 p-2">応募率</th>
                <th class="border border-gray-300 p-2">費用</th>
                <th class="border border-gray-300 p-2">クリック単価</th>
                <th class="border border-gray-300 p-2">応募開始単価</th>
                <th class="border border-gray-300 p-2">応募単価</th>
              </tr>
            </thead>
            <tbody>
              ${weeklyData
                .map(
                  (week: any, index: number) => `
                <tr class="${index % 2 === 0 ? "bg-gray-50" : "bg-white"}">
                  <td class="border border-gray-300 p-2 font-medium text-xs">${week.period}</td>
                  <td class="border border-gray-300 p-2">${week.impressions.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">${week.ctr.toFixed(2)}%</td>
                  <td class="border border-gray-300 p-2">${week.clicks.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">${week.asr.toFixed(2)}%</td>
                  <td class="border border-gray-300 p-2">${week.applicationStarts.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">${week.completionRate.toFixed(2)}%</td>
                  <td class="border border-gray-300 p-2">${week.applications.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">${week.ar.toFixed(2)}%</td>
                  <td class="border border-gray-300 p-2">¥${week.cost.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">¥${week.cpc.toFixed(0)}</td>
                  <td class="border border-gray-300 p-2">¥${week.cpas.toFixed(0)}</td>
                  <td class="border border-gray-300 p-2">¥${week.cpa.toFixed(0)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- グラフエリア -->
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="text-lg font-semibold mb-4">主要指標の週次推移</h3>
        <div class="bg-white p-4 rounded border">
          <div class="text-center text-gray-600 mb-4">
            <p class="text-sm">※ グラフは実装時に Chart.js または Recharts で表示</p>
          </div>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-blue-800 mb-2">クリック率推移</h4>
              <div class="space-y-1 text-sm">
                ${weeklyData
                  .slice(0, 5)
                  .map(
                    (week: any) => `
                  <div class="flex justify-between">
                    <span class="text-xs">${week.period.split("〜")[0]}</span>
                    <span class="font-medium">${week.ctr.toFixed(2)}%</span>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
            <div>
              <h4 class="font-medium text-green-800 mb-2">応募率推移</h4>
              <div class="space-y-1 text-sm">
                ${weeklyData
                  .slice(0, 5)
                  .map(
                    (week: any) => `
                  <div class="flex justify-between">
                    <span class="text-xs">${week.period.split("〜")[0]}</span>
                    <span class="font-medium">${week.ar.toFixed(2)}%</span>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
          <div class="mt-4 text-xs text-gray-500">
            <p>凡例: 青色（クリック率）、緑色（応募率）</p>
          </div>
        </div>
      </div>
    </div>
  `
}

function generateCampaignSlide(basicStats: any) {
  const { campaignBreakdown, periodInfo } = basicStats

  return `
    <div class="p-8 bg-white min-h-screen">
      <h1 class="text-3xl font-bold mb-8 text-center text-blue-900">全体効果: キャンペーンごと (${periodInfo.analysisTitle}) ※全体着地</h1>
      
      <!-- キャンペーン別データテーブル -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">キャンペーン別パフォーマンス一覧</h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse border border-gray-300 text-xs">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-gray-300 p-2">キャンペーン</th>
                <th class="border border-gray-300 p-2">表示回数</th>
                <th class="border border-gray-300 p-2">クリック率</th>
                <th class="border border-gray-300 p-2">クリック数</th>
                <th class="border border-gray-300 p-2">応募開始率</th>
                <th class="border border-gray-300 p-2">応募開始数</th>
                <th class="border border-gray-300 p-2">応募完了率</th>
                <th class="border border-gray-300 p-2">応募数</th>
                <th class="border border-gray-300 p-2">応募率</th>
                <th class="border border-gray-300 p-2">費用</th>
                <th class="border border-gray-300 p-2">クリック単価</th>
                <th class="border border-gray-300 p-2">応募開始単価</th>
                <th class="border border-gray-300 p-2">応募単価</th>
                <th class="border border-gray-300 p-2">対象件数</th>
              </tr>
            </thead>
            <tbody>
              ${campaignBreakdown
                .map(
                  (campaign: any, index: number) => `
                <tr class="${index % 2 === 0 ? "bg-gray-50" : "bg-white"}">
                  <td class="border border-gray-300 p-2 font-medium">${campaign.name}</td>
                  <td class="border border-gray-300 p-2">${campaign.impressions.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">${campaign.ctr.toFixed(2)}%</td>
                  <td class="border border-gray-300 p-2">${campaign.clicks.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">${campaign.asr.toFixed(2)}%</td>
                  <td class="border border-gray-300 p-2">${campaign.applicationStarts.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">${campaign.completionRate.toFixed(2)}%</td>
                  <td class="border border-gray-300 p-2">${campaign.applications.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">${campaign.ar.toFixed(2)}%</td>
                  <td class="border border-gray-300 p-2">¥${campaign.cost.toLocaleString()}</td>
                  <td class="border border-gray-300 p-2">¥${campaign.cpc.toFixed(0)}</td>
                  <td class="border border-gray-300 p-2">¥${campaign.cpas.toFixed(0)}</td>
                  <td class="border border-gray-300 p-2">¥${campaign.cpa.toFixed(0)}</td>
                  <td class="border border-gray-300 p-2">${campaign.jobCount.toLocaleString()}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 考察記入欄 -->
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="text-lg font-semibold mb-4">考察記入欄</h3>
        <div class="space-y-4">
          <div class="bg-white p-4 rounded border-l-4 border-blue-500">
            <h4 class="font-medium text-blue-800 mb-2">キャンペーン分析サマリー</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>最高CTR:</strong> ${Math.max(...campaignBreakdown.map((c: any) => c.ctr)).toFixed(2)}%
                <br><strong>最低CPA:</strong> ¥${Math.min(...campaignBreakdown.filter((c: any) => c.cpa > 0).map((c: any) => c.cpa)).toFixed(0)}
              </div>
              <div>
                <strong>総対象件数:</strong> ${campaignBreakdown.reduce((sum: number, c: any) => sum + c.jobCount, 0).toLocaleString()}件
                <br><strong>平均応募完了率:</strong> ${(campaignBreakdown.reduce((sum: number, c: any) => sum + c.completionRate, 0) / campaignBreakdown.length).toFixed(2)}%
              </div>
            </div>
          </div>
          
          <div class="bg-white p-4 rounded border-l-4 border-green-500">
            <h4 class="font-medium text-green-800 mb-2">高パフォーマンスキャンペーン</h4>
            <div class="text-sm text-gray-700">
              ${campaignBreakdown
                .filter((c: any) => c.ctr > 0)
                .sort((a: any, b: any) => b.ctr - a.ctr)
                .slice(0, 2)
                .map((c: any) => `<p>• ${c.name}: CTR ${c.ctr.toFixed(2)}%, CPA ¥${c.cpa.toFixed(0)}</p>`)
                .join("")}
            </div>
          </div>
          
          <div class="bg-white p-4 rounded border-l-4 border-yellow-500">
            <h4 class="font-medium text-yellow-800 mb-2">改善機会</h4>
            <div class="text-sm text-gray-700">
              ${campaignBreakdown
                .filter((c: any) => c.cpa > 0)
                .sort((a: any, b: any) => b.cpa - a.cpa)
                .slice(0, 2)
                .map((c: any) => `<p>• ${c.name}: CPA最適化の余地あり (現在¥${c.cpa.toFixed(0)})</p>`)
                .join("")}
            </div>
          </div>
          
          <div class="bg-white p-4 rounded border-l-4 border-purple-500">
            <h4 class="font-medium text-purple-800 mb-2">今後のアクションプラン</h4>
            <div class="text-sm text-gray-700 space-y-1">
              <p>• 高パフォーマンスキャンペーンの成功要因を他キャンペーンに横展開</p>
              <p>• CPAが高いキャンペーンの入札戦略とターゲティングを見直し</p>
              <p>• 応募完了率の低いキャンペーンのランディングページを改善</p>
              <p>• 週次でのパフォーマンス監視と迅速な最適化実施</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
