"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Presentation, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface SlideGeneratorProps {
  analysisResult: any
}

export function SlideGenerator({ analysisResult }: SlideGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [slides, setSlides] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const generateSlides = async () => {
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ analysisResult }),
      })

      if (!response.ok) {
        throw new Error("スライド生成に失敗しました")
      }

      const result = await response.json()
      setSlides(result.slides)
    } catch (err) {
      setError(err instanceof Error ? err.message : "スライド生成中にエラーが発生しました")
    } finally {
      setGenerating(false)
    }
  }

  const downloadPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4")
    const slideElements = document.querySelectorAll(".slide-content")

    for (let i = 0; i < slideElements.length; i++) {
      const element = slideElements[i] as HTMLElement
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (i > 0) {
        pdf.addPage()
      }

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
    }

    pdf.save("campaign-analysis-slides.pdf")
  }

  if (!analysisResult) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">まずデータ分析を完了してください。</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">プレゼンテーションスライド</h3>
          <p className="text-muted-foreground">分析結果を基にスライドを生成します</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateSlides} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Presentation className="h-4 w-4 mr-2" />
                スライド生成
              </>
            )}
          </Button>
          {slides.length > 0 && (
            <Button onClick={downloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF出力
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {slides.length === 0 && !generating && (
        <Card>
          <CardHeader>
            <CardTitle>スライドプレビュー</CardTitle>
            <CardDescription>分析結果を基に以下のようなスライドが生成されます</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="slide-content bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-lg">
                <h1 className="text-3xl font-bold text-center mb-6">キャンペーン効果分析</h1>
                <div className="text-center text-lg text-muted-foreground">
                  {new Date().toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              <div className="slide-content bg-white p-8 rounded-lg border">
                <h2 className="text-2xl font-bold mb-6">全体サマリー</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>総表示回数:</span>
                      <span className="font-semibold">
                        {analysisResult.basicStats.totalImpressions.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>総クリック数:</span>
                      <span className="font-semibold">{analysisResult.basicStats.totalClicks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>総応募数:</span>
                      <span className="font-semibold">
                        {analysisResult.basicStats.totalApplications.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>平均CTR:</span>
                      <span className="font-semibold">{analysisResult.basicStats.avgCTR.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>平均CPC:</span>
                      <span className="font-semibold">¥{analysisResult.basicStats.avgCPC.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>平均CPA:</span>
                      <span className="font-semibold">¥{analysisResult.basicStats.avgCPA.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="slide-content bg-white p-8 rounded-lg border">
                <h2 className="text-2xl font-bold mb-6">キャンペーン別パフォーマンス</h2>
                <div className="space-y-4">
                  {analysisResult.basicStats.campaignBreakdown.slice(0, 3).map((campaign: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded">
                      <div>
                        <h3 className="font-medium">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          表示回数: {campaign.impressions.toLocaleString()} | クリック数:{" "}
                          {campaign.clicks.toLocaleString()} | 応募数: {campaign.applications.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={campaign.ctr > analysisResult.basicStats.avgCTR ? "default" : "secondary"}>
                          CTR: {campaign.ctr.toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {slides.length > 0 && (
        <div className="space-y-6">
          {slides.map((slide: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  スライド {index + 1}: {slide.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="slide-content bg-white p-8 rounded-lg border min-h-[400px]"
                  dangerouslySetInnerHTML={{ __html: slide.content }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
