"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle } from "lucide-react"
import Papa from "papaparse"

interface FileUploadProps {
  onDataUploaded: (data: { campaigns?: any[]; dailyData?: any[] }) => void
}

export function FileUpload({ onDataUploaded }: FileUploadProps) {
  const [campaignFile, setCampaignFile] = useState<File | null>(null)
  const [dailyFile, setDailyFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (type: "campaign" | "daily", file: File | null) => {
    if (type === "campaign") {
      setCampaignFile(file)
    } else {
      setDailyFile(file)
    }
    setError(null)
    setSuccess(false)
  }

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV解析エラー: ${results.errors[0].message}`))
          } else {
            resolve(results.data)
          }
        },
        error: (error) => {
          reject(error)
        },
      })
    })
  }

  const handleUpload = async () => {
    if (!campaignFile && !dailyFile) {
      setError("少なくとも1つのファイルを選択してください")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data: { campaigns?: any[]; dailyData?: any[] } = {}

      if (campaignFile) {
        data.campaigns = await parseCSV(campaignFile)
      }

      if (dailyFile) {
        data.dailyData = await parseCSV(dailyFile)
      }

      setSuccess(true)
      onDataUploaded(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "ファイルの処理中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="campaign-file">キャンペーンデータ (CSV)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="campaign-file"
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange("campaign", e.target.files?.[0] || null)}
            />
            {campaignFile && <CheckCircle className="h-5 w-5 text-green-500" />}
          </div>
          <p className="text-sm text-muted-foreground">キャンペーン別の集計データ</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="daily-file">日次データ (CSV)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="daily-file"
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange("daily", e.target.files?.[0] || null)}
            />
            {dailyFile && <CheckCircle className="h-5 w-5 text-green-500" />}
          </div>
          <p className="text-sm text-muted-foreground">日別の詳細データ</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>ファイルが正常にアップロードされました。データ分析タブに進んでください。</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center">
        <Button onClick={handleUpload} disabled={loading || (!campaignFile && !dailyFile)} className="w-full md:w-auto">
          {loading ? (
            <>処理中...</>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              データを分析
            </>
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <FileText className="h-4 w-4 inline mr-1" />
        サポートされるファイル形式: CSV
      </div>
    </div>
  )
}
