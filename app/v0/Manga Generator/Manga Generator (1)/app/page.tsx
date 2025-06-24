"use client"

import { useState, useEffect, useRef } from "react"
import { MangaForm } from "@/components/manga-form"
import { MangaGallery } from "@/components/manga-gallery"
import { LoadingScreen } from "@/components/loading-screen"
import { ProgressBar } from "@/components/progress-bar"
import { MascotCharacter } from "@/components/mascot-character"
import { SuccessMessage } from "@/components/success-message"
import { ErrorMessage } from "@/components/error-message"

const POLLING_INTERVAL = 5000 // 5秒ごとにステータス確認
const MAX_POLLS = 30 // 最大30回ポーリング (5秒 * 30回 = 150秒)

export default function HomePage() {
  const [userQuestion, setUserQuestion] = useState("")
  const [userLevel, setUserLevel] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [streak, setStreak] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  const [currentStep, setCurrentStep] = useState<"intro" | "form" | "loading" | "result">("intro")

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const cleanupPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (workflowRunId && loading) {
      setLoadingMessage("漫画の生成処理を開始しました")
      setCurrentStep("loading")

      intervalRef.current = setInterval(async () => {
        setPollCount((currentPollCount) => {
          const nextPollCount = currentPollCount + 1
          console.log(`Polling... count: ${nextPollCount}`)
          ;(async () => {
            try {
              const response = await fetch(`/api/check-manga-status/${workflowRunId}`)
              const data = await response.json()

              if (!response.ok) {
                throw new Error(data.error || "処理状況の確認に失敗しました")
              }

              setLoadingMessage(`処理状況: ${data.status}`)

              if (data.status === "succeeded") {
                cleanupPolling()
                if (data.imageUrls && data.imageUrls.length > 0) {
                  setImageUrls(data.imageUrls)
                  setShowSuccess(true)
                  setCurrentStep("result")
                  setStreak((prev) => prev + 1)
                  console.log("Generated image URLs:", data.imageUrls)
                } else {
                  setError("漫画は生成されましたが、画像が見つかりませんでした")
                  console.warn("Succeeded, but no image URLs:", data.raw_outputs)
                }
                setLoading(false)
                setWorkflowRunId(null)
              } else if (data.status === "failed" || data.status === "stopped") {
                cleanupPolling()
                setError(`漫画の生成に失敗しました。理由: ${data.error || "不明なエラー"}`)
                setLoading(false)
                setWorkflowRunId(null)
              } else if (nextPollCount >= MAX_POLLS) {
                cleanupPolling()
                setError("処理がタイムアウトしました。しばらくしてからもう一度お試しください")
                setLoading(false)
                setWorkflowRunId(null)
              }
            } catch (err) {
              cleanupPolling()
              console.error(err)
              setError(err instanceof Error ? err.message : "状況確認中に不明なエラーが発生しました")
              setLoading(false)
              setWorkflowRunId(null)
            }
          })()
          return nextPollCount
        })
      }, POLLING_INTERVAL)
    }

    return () => {
      cleanupPolling()
    }
  }, [workflowRunId, loading])

  const handleSubmit = async (question: string, level: string) => {
    setLoading(true)
    setLoadingMessage("生成リクエストを送信中...")
    setError(null)
    setImageUrls([])
    setWorkflowRunId(null)
    setPollCount(0)
    setShowSuccess(false)
    cleanupPolling()

    try {
      const response = await fetch("/api/initiate-manga-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_question: question,
          user_level: level,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "漫画生成の開始に失敗しました")
      }

      if (data.workflow_run_id) {
        setWorkflowRunId(data.workflow_run_id)
      } else {
        throw new Error("workflow_run_id を取得できませんでした")
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました")
      setLoading(false)
    }
  }

  const startApp = () => {
    setShowIntro(false)
    setCurrentStep("form")
  }

  const resetApp = () => {
    setImageUrls([])
    setError(null)
    setShowSuccess(false)
    setCurrentStep("form")
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ヘッダー */}
      <header className="bg-[#00bcd4] p-4 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">AIマンガ</div>
      </header>

      {/* プログレスバー */}
      {currentStep !== "intro" && (
        <ProgressBar
          progress={currentStep === "form" ? 20 : currentStep === "loading" ? 20 + (pollCount / MAX_POLLS) * 60 : 100}
          streak={streak}
        />
      )}

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col">
        {currentStep === "intro" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-32 h-32 mb-6">
              <MascotCharacter type="reading" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">AIマンガでわかるシリーズ</h1>
            <p className="text-gray-600 mb-8">
              今、<span className="text-[#00bcd4] font-bold">3,200万人</span>のみんなが
              <br />
              AIマンガで学習中だよ！心強いね！
            </p>
            <button
              onClick={startApp}
              className="w-full max-w-md bg-[#00bcd4] text-white py-3 px-4 rounded-xl font-bold text-lg shadow-md hover:bg-[#00acc1] transition-colors"
            >
              スタート
            </button>
          </div>
        )}

        {currentStep === "form" && (
          <div className="flex-1 p-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">質問を入力してください</h2>
            <MangaForm onSubmit={handleSubmit} isLoading={loading} />
          </div>
        )}

        {currentStep === "loading" && (
          <LoadingScreen message={loadingMessage} progress={(pollCount / MAX_POLLS) * 100} />
        )}

        {currentStep === "result" && (
          <div className="flex-1 p-4 flex flex-col">
            {showSuccess && <SuccessMessage />}
            {error && <ErrorMessage message={error} />}
            {imageUrls.length > 0 && <MangaGallery imageUrls={imageUrls} />}

            <button
              onClick={resetApp}
              className="mt-6 w-full bg-[#00bcd4] text-white py-3 px-4 rounded-xl font-bold text-lg shadow-md hover:bg-[#00acc1] transition-colors"
            >
              次へ
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
