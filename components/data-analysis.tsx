"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users, DollarSign, MousePointer, Target } from "lucide-react"

interface DataAnalysisProps {
  csvData: {
    campaigns?: any[]
    dailyData?: any[]
  }
  onAnalysisComplete: (result: any) => void
}

export function DataAnalysis({ csvData, onAnalysisComplete }: DataAnalysisProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (csvData.campaigns || csvData.dailyData) {
      performAnalysis()
    }
  }, [csvData])

  const performAnalysis = async () => {
    setAnalyzing(true)
    setError(null)

    try {
      // Step 1: データの基本統計を計算
      const basicStats = calculateBasicStats()

      // Step 2: OpenAI APIを使って分析
      const aiAnalysis = await performAIAnalysis(basicStats)

      // Step 3: 結果をまとめる
      const finalResult = {
        basicStats,
        aiAnalysis,
        recommendations: generateRecommendations(basicStats),
      }

      setSummary(finalResult)
      onAnalysisComplete(finalResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析中にエラーが発生しました")
    } finally {
      setAnalyzing(false)
    }
  }

  const calculateBasicStats = () => {
    const stats: any = {
      // 期間情報
      periodInfo: {
        startDate: null,
        endDate: null,
        mainMonth: null,
        baseMonth: null,
        analysisTitle: "",
      },
      // 月次データ（汎用的な構造）
      monthlyData: [],
      // 週次データ
      weeklyData: [],
      // キャンペーン別データ
      campaignBreakdown: [],
      // 全体統計
      totalImpressions: 0,
      totalClicks: 0,
      totalApplications: 0,
      totalCost: 0,
      avgCTR: 0,
      avgCPC: 0,
      avgCPA: 0,
    }

    // 日次データから期間情報を抽出
    if (csvData.dailyData && csvData.dailyData.length > 0) {
      const dates = csvData.dailyData
        .map((row: any) => new Date(row["期間：日単位"]))
        .filter((date) => !isNaN(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime())

      if (dates.length > 0) {
        stats.periodInfo.startDate = dates[0]
        stats.periodInfo.endDate = dates[dates.length - 1]

        // 主要月を最も多くのデータがある月として設定
        const monthCounts: { [key: string]: number } = {}
        dates.forEach((date) => {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
        })

        const mainMonthKey = Object.keys(monthCounts).reduce((a, b) => (monthCounts[a] > monthCounts[b] ? a : b))

        stats.periodInfo.mainMonth = mainMonthKey

        // 基準月を主要月の前月として設定
        const [year, month] = mainMonthKey.split("-").map(Number)
        // 前月を正しく計算（年をまたぐ場合も考慮）
        let baseYear = year
        let baseMonth = month - 1
        if (baseMonth < 1) {
          baseMonth = 12
          baseYear = year - 1
        }
        stats.periodInfo.baseMonth = `${baseYear}-${String(baseMonth).padStart(2, "0")}`

        // 分析タイトル用の期間文字列
        stats.periodInfo.analysisTitle = `${formatDate(stats.periodInfo.startDate)}〜${formatDate(stats.periodInfo.endDate)}`
      }

      // 月次データの集計
      const monthlyAggregation: { [key: string]: any } = {}

      csvData.dailyData.forEach((row: any) => {
        const date = new Date(row["期間：日単位"])
        if (isNaN(date.getTime())) return

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        const monthName = `${date.getMonth() + 1}月`

        if (!monthlyAggregation[monthKey]) {
          monthlyAggregation[monthKey] = {
            period: monthName,
            monthKey,
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

        const impressions = Number.parseInt(row["表示回数"]?.toString().replace(/,/g, "") || "0")
        const clicks = Number.parseInt(row["クリック数"]?.toString().replace(/,/g, "") || "0")
        const applications = Number.parseInt(row["応募数"]?.toString().replace(/,/g, "") || "0")
        const applicationStarts = Number.parseInt(row["応募開始数"]?.toString().replace(/,/g, "") || "0")
        const cost = Number.parseInt(row["費用"]?.toString().replace(/[¥,]/g, "") || "0")

        monthlyAggregation[monthKey].impressions += impressions
        monthlyAggregation[monthKey].clicks += clicks
        monthlyAggregation[monthKey].applications += applications
        monthlyAggregation[monthKey].applicationStarts += applicationStarts
        monthlyAggregation[monthKey].cost += cost

        stats.totalImpressions += impressions
        stats.totalClicks += clicks
        stats.totalApplications += applications
        stats.totalCost += cost
      })

      // 月次データの計算値を算出
      Object.values(monthlyAggregation).forEach((monthData: any) => {
        if (monthData.impressions > 0) {
          monthData.ctr = (monthData.clicks / monthData.impressions) * 100
          monthData.ar = (monthData.applications / monthData.impressions) * 100
          monthData.asr = (monthData.applicationStarts / monthData.impressions) * 100
        }
        if (monthData.clicks > 0) {
          monthData.cpc = monthData.cost / monthData.clicks
        }
        if (monthData.applications > 0) {
          monthData.cpa = monthData.cost / monthData.applications
        }
        if (monthData.applicationStarts > 0) {
          monthData.cpas = monthData.cost / monthData.applicationStarts
          monthData.completionRate = (monthData.applications / monthData.applicationStarts) * 100
        }
      })

      stats.monthlyData = Object.values(monthlyAggregation).sort((a: any, b: any) =>
        a.monthKey.localeCompare(b.monthKey),
      )

      // 週次データの集計
      const weeklyAggregation: { [key: string]: any } = {}

      csvData.dailyData.forEach((row: any) => {
        const date = new Date(row["期間：日単位"])
        if (isNaN(date.getTime())) return

        const weekKey = getWeekKey(date)

        if (!weeklyAggregation[weekKey]) {
          weeklyAggregation[weekKey] = {
            period: weekKey,
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

        const impressions = Number.parseInt(row["表示回数"]?.toString().replace(/,/g, "") || "0")
        const clicks = Number.parseInt(row["クリック数"]?.toString().replace(/,/g, "") || "0")
        const applications = Number.parseInt(row["応募数"]?.toString().replace(/,/g, "") || "0")
        const applicationStarts = Number.parseInt(row["応募開始数"]?.toString().replace(/,/g, "") || "0")
        const cost = Number.parseInt(row["費用"]?.toString().replace(/[¥,]/g, "") || "0")

        weeklyAggregation[weekKey].impressions += impressions
        weeklyAggregation[weekKey].clicks += clicks
        weeklyAggregation[weekKey].applications += applications
        weeklyAggregation[weekKey].applicationStarts += applicationStarts
        weeklyAggregation[weekKey].cost += cost
      })

      // 週次データの計算値を算出
      Object.values(weeklyAggregation).forEach((weekData: any) => {
        if (weekData.impressions > 0) {
          weekData.ctr = (weekData.clicks / weekData.impressions) * 100
          weekData.ar = (weekData.applications / weekData.impressions) * 100
          weekData.asr = (weekData.applicationStarts / weekData.impressions) * 100
        }
        if (weekData.clicks > 0) {
          weekData.cpc = weekData.cost / weekData.clicks
        }
        if (weekData.applications > 0) {
          weekData.cpa = weekData.cost / weekData.applications
        }
        if (weekData.applicationStarts > 0) {
          weekData.cpas = weekData.cost / weekData.applicationStarts
          weekData.completionRate = (weekData.applications / weekData.applicationStarts) * 100
        }
      })

      stats.weeklyData = Object.values(weeklyAggregation).sort((a: any, b: any) => a.period.localeCompare(b.period))
    }

    // キャンペーンデータの処理
    if (csvData.campaigns) {
      csvData.campaigns.forEach((row: any) => {
        const impressions = Number.parseInt(row["表示回数"]?.toString().replace(/,/g, "") || "0")
        const clicks = Number.parseInt(row["クリック数"]?.toString().replace(/,/g, "") || "0")
        const applications = Number.parseInt(row["応募数"]?.toString().replace(/,/g, "") || "0")
        const applicationStarts = Number.parseInt(row["応募開始数"]?.toString().replace(/,/g, "") || "0")
        const cost = Number.parseInt(row["費用"]?.toString().replace(/[¥,]/g, "") || "0")
        const jobCount = Number.parseInt(row["Job Count"]?.toString().replace(/,/g, "") || "0")

        stats.campaignBreakdown.push({
          name: row["キャンペーン"] || "Unknown",
          impressions,
          clicks,
          applications,
          applicationStarts,
          cost,
          jobCount,
          ctr: Number.parseFloat(row["クリック率（CTR）"]?.toString() || "0") * 100,
          asr: Number.parseFloat(row["応募開始率 (ASR)"]?.toString() || "0") * 100,
          completionRate: Number.parseFloat(row["応募完了率"]?.toString() || "0") * 100,
          ar: Number.parseFloat(row["応募率 (AR)"]?.toString() || "0") * 100,
          cpc: Number.parseFloat(row["クリック単価（CPC）"]?.toString().replace(/[¥,]/g, "") || "0"),
          cpas: Number.parseFloat(row["応募開始単価（CPAS）"]?.toString().replace(/[¥,]/g, "") || "0"),
          cpa: Number.parseFloat(row["応募単価（CPA）"]?.toString().replace(/[¥,]/g, "") || "0"),
        })
      })
    }

    // 全体平均の計算
    if (stats.totalImpressions > 0) {
      stats.avgCTR = (stats.totalClicks / stats.totalImpressions) * 100
    }
    if (stats.totalClicks > 0) {
      stats.avgCPC = stats.totalCost / stats.totalClicks
    }
    if (stats.totalApplications > 0) {
      stats.avgCPA = stats.totalCost / stats.totalApplications
    }

    return stats
  }

  // 週のキーを生成する関数
  const getWeekKey = (date: Date) => {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay()) // 日曜日を週の開始とする

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    return `${formatDate(startOfWeek)}〜${formatDate(endOfWeek)}`
  }

  // 日付フォーマット関数
  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const performAIAnalysis = async (basicStats: any) => {
    // Check if API key is available
    const apiKeyCheck = await fetch("/api/check-api-key")
    const keyStatus = await apiKeyCheck.json()

    if (keyStatus.status !== "valid") {
      throw new Error("OpenAI APIキーが設定されていないか無効です。設定を確認してください。")
    }

    const response = await fetch("/api/analyze-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stats: basicStats,
        campaigns: csvData.campaigns,
        dailyData: csvData.dailyData,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "AI分析に失敗しました")
    }

    return await response.json()
  }

  const generateRecommendations = (stats: any) => {
    const recommendations = []

    // CTRが低いキャンペーンの特定
    const lowCTRCampaigns = stats.campaignBreakdown.filter((c: any) => c.ctr < stats.avgCTR * 0.8)
    if (lowCTRCampaigns.length > 0) {
      recommendations.push({
        type: "warning",
        title: "CTR改善が必要",
        description: `${lowCTRCampaigns.length}個のキャンペーンでCTRが平均を下回っています`,
      })
    }

    // 高コストキャンペーンの特定
    const highCostCampaigns = stats.campaignBreakdown.filter((c: any) => c.cpa > stats.avgCPA * 1.2)
    if (highCostCampaigns.length > 0) {
      recommendations.push({
        type: "info",
        title: "コスト最適化の機会",
        description: `${highCostCampaigns.length}個のキャンペーンでCPAが高くなっています`,
      })
    }

    return recommendations
  }

  if (analyzing) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold">データを分析中...</h3>
          <p className="text-muted-foreground">AIがデータを解析しています</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!summary) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">分析を開始するには、まずCSVファイルをアップロードしてください。</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総表示回数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.basicStats.totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総クリック数</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.basicStats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">CTR: {summary.basicStats.avgCTR.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総応募数</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.basicStats.totalApplications.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総費用</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summary.basicStats.totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">CPA: ¥{summary.basicStats.avgCPA.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {summary.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>推奨事項</CardTitle>
            <CardDescription>データ分析に基づく改善提案</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recommendations.map((rec: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <Badge variant={rec.type === "warning" ? "destructive" : "default"}>
                    {rec.type === "warning" ? "要注意" : "提案"}
                  </Badge>
                  <div>
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={() => onAnalysisComplete(summary)}>
          <TrendingUp className="h-4 w-4 mr-2" />
          スライド生成に進む
        </Button>
      </div>
    </div>
  )
}
