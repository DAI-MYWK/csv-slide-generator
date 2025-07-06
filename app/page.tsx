"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/file-upload"
import { DataAnalysis } from "@/components/data-analysis"
import { SlideGenerator } from "@/components/slide-generator"
import { Upload, BarChart3, FileText, CheckCircle, Key } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ApiKeySetup } from "@/components/api-key-setup"

export default function Home() {
  const [csvData, setCsvData] = useState<{
    campaigns?: any[]
    dailyData?: any[]
  }>({})
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("upload")

  const [apiKeyStatus, setApiKeyStatus] = useState<"checking" | "valid" | "invalid" | "missing">("checking")
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)

  useEffect(() => {
    checkApiKeyStatus()
  }, [])

  const checkApiKeyStatus = async () => {
    try {
      const response = await fetch("/api/check-api-key")
      const result = await response.json()
      setApiKeyStatus(result.status)

      if (result.status === "missing" || result.status === "invalid") {
        setShowApiKeySetup(true)
      }
    } catch (error) {
      setApiKeyStatus("invalid")
      setShowApiKeySetup(true)
    }
  }

  const handleApiKeyValidated = () => {
    setShowApiKeySetup(false)
    checkApiKeyStatus()
  }

  const handleDataUploaded = (data: any) => {
    setCsvData(data)
    setActiveTab("analysis")
  }

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result)
    setActiveTab("slides")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">CSV データ集計 & スライド生成</h1>
        <p className="text-lg text-muted-foreground">
          CSVファイルをアップロードして、AIを使ってデータを分析し、プレゼンテーション用のスライドを自動生成します
        </p>
      </div>

      {showApiKeySetup && (
        <div className="mb-8">
          <ApiKeySetup onApiKeyValidated={handleApiKeyValidated} />
        </div>
      )}

      {apiKeyStatus === "missing" && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            OpenAI API キーが設定されていません。環境変数 OPENAI_API_KEY を設定してください。
          </AlertDescription>
        </Alert>
      )}

      {apiKeyStatus === "invalid" && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>OpenAI API キーが無効です。正しいAPIキーを設定してください。</AlertDescription>
        </Alert>
      )}

      {apiKeyStatus === "valid" && (
        <>
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>OpenAI API接続が確認されました。AI機能が利用可能です。</AlertDescription>
          </Alert>
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={() => setShowApiKeySetup(!showApiKeySetup)}>
              <Key className="h-4 w-4 mr-2" />
              API設定
            </Button>
          </div>
        </>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            ファイルアップロード
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="flex items-center gap-2"
            disabled={!csvData.campaigns && !csvData.dailyData}
          >
            <BarChart3 className="h-4 w-4" />
            データ分析
          </TabsTrigger>
          <TabsTrigger value="slides" className="flex items-center gap-2" disabled={!analysisResult}>
            <FileText className="h-4 w-4" />
            スライド生成
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>CSVファイルのアップロード</CardTitle>
              <CardDescription>キャンペーンデータと日次データのCSVファイルをアップロードしてください</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onDataUploaded={handleDataUploaded} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>データ分析</CardTitle>
              <CardDescription>アップロードされたデータを分析し、重要な指標を抽出します</CardDescription>
            </CardHeader>
            <CardContent>
              <DataAnalysis csvData={csvData} onAnalysisComplete={handleAnalysisComplete} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slides" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>スライド生成</CardTitle>
              <CardDescription>分析結果を基にプレゼンテーション用のスライドを生成します</CardDescription>
            </CardHeader>
            <CardContent>
              <SlideGenerator analysisResult={analysisResult} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
