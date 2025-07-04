"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
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
  const [progress, setProgress] = useState(0)
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
    setProgress(0)

    try {
      // Step 1: データの基本統計を計算
      setProgress(25)
      const basicStats = calculateBasicStats()

      // Step 2: OpenAI APIを使って分析
      setProgress(50)
      const aiAnalysis = await performAIAnalysis(basicStats)

      // Step 3: 結果をまとめる
      setProgress(75)
      const finalResult = {
        basicStats,
        aiAnalysis,
        recommendations: generateRecommendations(basicStats),
      }

      setProgress(100)
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
      totalImpressions: 0,
      totalClicks: 0,
      totalApplications: 0,
      totalCost: 0,
      avgCTR: 0,
      avgCPC: 0,
      avgCPA: 0,
      campaignBreakdown: [],
      timeSeriesData: [],
      monthlySummary: {},
      momComparison: {},
    }

    // キャンペーンデータの集計
    if (csvData.campaigns) {
      csvData.campaigns.forEach((row: any) => {
        const impressions = Number.parseInt(row["表示回数"]?.replace(/,/g, "") || "0")
        const clicks = Number.parseInt(row["クリック数"]?.replace(/,/g, "") || "0")
        const applications = Number.parseInt(row["応募数"]?.replace(/,/g, "") || "0")
        const cost = Number.parseInt(row["費用"]?.replace(/[¥,]/g, "") || "0")

        stats.totalImpressions += impressions
        stats.totalClicks += clicks
        stats.totalApplications += applications
        stats.totalCost += cost

        stats.campaignBreakdown.push({
          name: row["キャンペーン"] || "Unknown",
          impressions,
          clicks,
          applications,
          cost,
          ctr: Number.parseFloat(row["クリック率（CTR）"] || "0"),
          cpc: Number.parseFloat(row["クリック単価（CPC）"]?.replace(/[¥,]/g, "") || "0"),
          cpa: Number.parseFloat(row["応募単価（CPA）"]?.replace(/[¥,]/g, "") || "0"),
        })
      })
    }

    // 日次データの処理
    if (csvData.dailyData) {
      csvData.dailyData.forEach((row: any) => {
        const dateStr = row["期間：日単位"]
        const impressions = Number.parseInt(row["表示回数"]?.replace(/,/g, "") || "0")
        const clicks = Number.parseInt(row["クリック数"]?.replace(/,/g, "") || "0")
        const applications = Number.parseInt(row["応募数"]?.replace(/,/g, "") || "0")
        const cost = Number.parseInt(row["費用"]?.replace(/[¥,]/g, "") || "0")

        stats.timeSeriesData.push({
          date: dateStr,
          impressions,
          clicks,
          applications,
          ctr: Number.parseFloat(row["クリック率（CTR）"] || "0"),
          cost,
        })

        const date = new Date(dateStr)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        if (!stats.monthlySummary[monthKey]) {
          stats.monthlySummary[monthKey] = { impressions: 0, clicks: 0, applications: 0, cost: 0 }
        }
        stats.monthlySummary[monthKey].impressions += impressions
        stats.monthlySummary[monthKey].clicks += clicks
        stats.monthlySummary[monthKey].applications += applications
        stats.monthlySummary[monthKey].cost += cost
      })

      const months = Object.keys(stats.monthlySummary).sort()
      if (months.length >= 2) {
        const curr = stats.monthlySummary[months[months.length - 1]]
        const prev = stats.monthlySummary[months[months.length - 2]]
        stats.momComparison = {
          impressions: prev.impressions ? ((curr.impressions - prev.impressions) / prev.impressions) * 100 : null,
          clicks: prev.clicks ? ((curr.clicks - prev.clicks) / prev.clicks) * 100 : null,
          applications: prev.applications ? ((curr.applications - prev.applications) / prev.applications) * 100 : null,
          cost: prev.cost ? ((curr.cost - prev.cost) / prev.cost) * 100 : null,
        }
      }
    }

    // 平均値の計算
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

  const performAIAnalysis = async (basicStats: any) => {
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
      throw new Error("AI分析に失敗しました")
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
        <Progress value={progress} className="w-full" />
        <p className="text-center text-sm text-muted-foreground">{progress}% 完了</p>
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
