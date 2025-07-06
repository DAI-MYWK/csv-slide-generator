"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Key, ExternalLink, Copy, Check, AlertTriangle, Info } from "lucide-react"

interface ApiKeySetupProps {
  onApiKeyValidated: () => void
}

export function ApiKeySetup({ onApiKeyValidated }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ status: "error", message: "APIキーを入力してください" })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/test-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      const result = await response.json()
      setTestResult(result)

      if (result.status === "valid") {
        onApiKeyValidated()
      }
    } catch (error) {
      setTestResult({
        status: "error",
        message: "テスト中にエラーが発生しました",
      })
    } finally {
      setTesting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const envVarExample = `# .env.local
OPENAI_API_KEY=sk-your-api-key-here`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenAI API キー設定
          </CardTitle>
          <CardDescription>AI機能を使用するためにOpenAI APIキーを設定してください</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">セットアップ</TabsTrigger>
              <TabsTrigger value="instructions">設定手順</TabsTrigger>
              <TabsTrigger value="troubleshooting">トラブルシューティング</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="api-key">OpenAI API キー</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="font-mono"
                    />
                    <Button onClick={testApiKey} disabled={testing || !apiKey.trim()}>
                      {testing ? "テスト中..." : "テスト"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    APIキーは安全に処理され、サーバーに保存されません
                  </p>
                </div>

                {testResult && (
                  <Alert variant={testResult.status === "valid" ? "default" : "destructive"}>
                    {testResult.status === "valid" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      {testResult.message}
                      {testResult.status === "valid" && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-green-700">
                            接続成功
                          </Badge>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">APIキーの取得方法</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        OpenAI Platform でアカウントを作成し、API キーを生成してください
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => window.open("https://platform.openai.com/api-keys", "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        OpenAI Platform
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="instructions" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">環境変数での設定（推奨）</h3>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      本番環境では環境変数を使用してAPIキーを設定することを強く推奨します
                    </p>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm font-medium">環境変数の設定例</Label>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(envVarExample)}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <pre className="text-sm bg-white p-3 rounded border font-mono">{envVarExample}</pre>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Vercelでのデプロイ時</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Vercelダッシュボードでプロジェクトを選択</li>
                    <li>Settings → Environment Variables に移動</li>
                    <li>
                      Name: <code className="bg-gray-100 px-1 rounded">OPENAI_API_KEY</code>
                    </li>
                    <li>Value: あなたのOpenAI APIキー</li>
                    <li>Environment: Production, Preview, Development を選択</li>
                    <li>プロジェクトを再デプロイ</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">ローカル開発時</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      プロジェクトルートに <code className="bg-gray-100 px-1 rounded">.env.local</code> ファイルを作成
                    </li>
                    <li>上記の環境変数例をコピー</li>
                    <li>APIキーを実際の値に置き換え</li>
                    <li>開発サーバーを再起動</li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="troubleshooting" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">よくある問題と解決方法</h3>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-red-600 mb-2">❌ "Invalid API key"</h4>
                      <p className="text-sm text-muted-foreground mb-2">APIキーが無効または間違っています</p>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• APIキーが正しくコピーされているか確認</li>
                        <li>• APIキーが有効期限内か確認</li>
                        <li>• OpenAI Platformで新しいキーを生成</li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-yellow-600 mb-2">⚠️ "Quota exceeded"</h4>
                      <p className="text-sm text-muted-foreground mb-2">API使用量の上限に達しています</p>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• OpenAI Platformで使用量を確認</li>
                        <li>• 請求情報を更新</li>
                        <li>• 使用量制限を調整</li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-blue-600 mb-2">ℹ️ "Environment variable not set"</h4>
                      <p className="text-sm text-muted-foreground mb-2">環境変数が設定されていません</p>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• .env.local ファイルが正しい場所にあるか確認</li>
                        <li>• 環境変数名が正確か確認（OPENAI_API_KEY）</li>
                        <li>• サーバーを再起動</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">セキュリティに関する注意</h4>
                      <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                        <li>• APIキーを公開リポジトリにコミットしないでください</li>
                        <li>• .env.local ファイルを .gitignore に追加してください</li>
                        <li>• 定期的にAPIキーをローテーションしてください</li>
                        <li>• 不要になったAPIキーは削除してください</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
