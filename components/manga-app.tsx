"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { MangaForm } from "@/components/manga-form"
import { MangaGallery } from "@/components/manga-gallery"
import { MangaLibrary } from "@/components/manga-library"
import { ProgressBar } from "@/components/progress-bar"
import { MascotCharacter } from "@/components/mascot-character"
import { SuccessMessage } from "@/components/success-message"
import { ErrorMessage } from "@/components/error-message"
import { MangaLibrary as MangaLibraryType } from "@/lib/supabase"

export function MangaApp() {
  const [userQuestion, setUserQuestion] = useState("")
  const [userLevel, setUserLevel] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [streak, setStreak] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  const [currentStep, setCurrentStep] = useState<"intro" | "form" | "generating" | "result">("intro")
  const [currentTab, setCurrentTab] = useState<"generate" | "library">("generate")
  const [selectedManga, setSelectedManga] = useState<MangaLibraryType | null>(null)
  
  // Difyワークフロー関連の状態
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // 状態永続化のためのキー
  const STORAGE_KEY = 'dify-manga-app-state'
  
  // 状態をlocalStorageに保存
  const saveState = () => {
    if (typeof window === 'undefined') return
    
    const stateToSave = {
      userQuestion,
      userLevel,
      imageUrls,
      showSuccess,
      currentStep,
      currentTab,
      workflowRunId,
      isGenerating,
      timestamp: Date.now()
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
      console.log('💾 状態を保存しました:', stateToSave.currentStep)
    } catch (error) {
      console.error('❌ 状態保存エラー:', error)
    }
  }
  
  // localStorageから状態を復元
  const loadState = () => {
    if (typeof window === 'undefined') return null
    
    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (!savedState) return null
      
      const parsed = JSON.parse(savedState)
      
      // 24時間以上経過した状態は破棄
      if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY)
        console.log('🕒 古い状態を破棄しました')
        return null
      }
      
      console.log('📂 状態を復元しました:', parsed.currentStep)
      return parsed
    } catch (error) {
      console.error('❌ 状態復元エラー:', error)
      return null
    }
  }

  // コンポーネントマウント時に状態を復元または初期化
  useEffect(() => {
    console.log('🔄 MangaApp: コンポーネントマウント - 状態復元を試行')
    
    const savedState = loadState()
    
    if (savedState) {
      // 保存された状態を復元
      console.log('📂 保存された状態を復元中...')
      setUserQuestion(savedState.userQuestion || "")
      setUserLevel(savedState.userLevel || "")
      setImageUrls(savedState.imageUrls || [])
      setShowSuccess(savedState.showSuccess || false)
      setCurrentStep(savedState.currentStep || "intro")
      setCurrentTab(savedState.currentTab || "generate")
      setWorkflowRunId(savedState.workflowRunId || null)
      setIsGenerating(savedState.isGenerating || false)
      
      // イントロ画面フラグは状態に応じて設定
      setShowIntro(savedState.currentStep === "intro")
      setError(null) // エラーは復元時にクリア
      setSelectedManga(null) // 選択された漫画は復元時にクリア
      
      console.log('✅ 状態復元完了:', savedState.currentStep)
      
      // 生成中だった場合はポーリングを再開
      if (savedState.isGenerating && savedState.workflowRunId) {
        console.log('🔄 生成中のワークフローを再開:', savedState.workflowRunId)
        pollWorkflowStatus(savedState.workflowRunId)
      }
    } else {
      // 初回訪問時は初期状態にセット
      console.log('🆕 初回訪問 - 初期状態にセット')
      setCurrentStep("intro")
      setShowIntro(true)
      setError(null)
      setImageUrls([])
      setShowSuccess(false)
      setSelectedManga(null)
      setWorkflowRunId(null)
      setIsGenerating(false)
      setUserQuestion("")
      setUserLevel("")
      setCurrentTab("generate")
    }
    
    console.log('✅ MangaApp: 初期化完了')
  }, [])

  // 認証状態の変更を監視
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 MangaApp: 認証状態変更 -', event, session?.user?.email)
      
      // 新規ログイン時のみイントロにリセット（既存セッションの継続は除く）
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🚀 MangaApp: ログイン成功検出')
        
        // 保存された状態があるかチェック
        const savedState = loadState()
        
        if (!savedState) {
          // 保存された状態がない場合のみイントロにリセット
          console.log('📝 新規ログイン - イントロ画面に移行')
          setCurrentStep("intro")
          setShowIntro(true)
          setIsGenerating(false)
          setError(null)
          setWorkflowRunId(null)
          setSelectedManga(null)
        } else {
          console.log('📂 既存セッション継続 - 状態を保持')
          // 既存の状態を保持（何もしない）
        }
      }
      
      // ログアウト時は状態をクリア
      if (event === 'SIGNED_OUT') {
        console.log('👋 ログアウト - 状態をクリア')
        localStorage.removeItem(STORAGE_KEY)
        setCurrentStep("intro")
        setShowIntro(true)
        setIsGenerating(false)
        setError(null)
        setWorkflowRunId(null)
        setSelectedManga(null)
        setImageUrls([])
        setShowSuccess(false)
        setUserQuestion("")
        setUserLevel("")
      }
    })

    return () => subscription.unsubscribe()
  }, [])
  
  // 状態が変更されたときに自動保存
  useEffect(() => {
    // 初期化完了後のみ保存（無限ループを防ぐ）
    if (currentStep !== "intro" || userQuestion || workflowRunId) {
      saveState()
    }
  }, [currentStep, userQuestion, userLevel, imageUrls, showSuccess, currentTab, workflowRunId, isGenerating])
  
  // ページ離脱時とvisibility変更時に状態を保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveState()
    }
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveState()
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Difyワークフロー処理
  const handleSubmit = async (question: string, level: string) => {
    setUserQuestion(question)
    setUserLevel(level)
    setError(null)
    setImageUrls([])
    setShowSuccess(false)
    setCurrentStep("generating")
    setIsGenerating(true)

    try {
      console.log('🎯 Starting Dify workflow...')
      
      // Difyワークフローを開始
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
        throw new Error(data.error || "ワークフローの開始に失敗しました")
      }

      console.log('✅ Workflow started:', data.workflow_run_id)
      
      setWorkflowRunId(data.workflow_run_id)
      
      // ポーリングを開始
      pollWorkflowStatus(data.workflow_run_id)

    } catch (err) {
      console.error('❌ Workflow start error:', err)
      
      let errorMessage = "マンガ生成の開始に失敗しました";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage)
      setIsGenerating(false)
      setCurrentStep("form")
    }
  }

  // Difyワークフロー状態をポーリング
  const pollWorkflowStatus = async (workflowId: string) => {
    console.log('🔄 Starting polling for workflow:', workflowId)
    
    const maxAttempts = 60 // 最大10分間ポーリング
    let attempts = 0
    
    const poll = async () => {
      attempts++
      
      try {
        const response = await fetch(`/api/check-manga-status/${workflowId}`)
        const data = await response.json()
        
        console.log(`🔍 Polling attempt ${attempts}:`, data.status)
        
        if (data.status === 'succeeded' && data.imageUrls) {
          console.log('🎉 Workflow completed successfully!')
          setImageUrls(data.imageUrls)
          setShowSuccess(true)
          setCurrentStep("result")
          setIsGenerating(false)
          setStreak((prev) => prev + 1)
          return
        }
        
        if (data.status === 'failed') {
          throw new Error('ワークフローが失敗しました')
        }
        
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000) // 10秒後に再試行
        } else {
          throw new Error('タイムアウト: マンガ生成に時間がかかりすぎています')
        }
        
      } catch (err) {
        console.error('❌ Polling error:', err)
        setError(err instanceof Error ? err.message : 'ワークフロー確認中にエラーが発生しました')
        setIsGenerating(false)
        setCurrentStep("form")
      }
    }
    
    // 最初のポーリングを5秒後に開始
    setTimeout(poll, 5000)
  }

  const startApp = () => {
    console.log('🎯 MangaApp: スタートボタンが押されました - フォームに移行')
    setShowIntro(false)
    setCurrentStep("form")
    console.log('✅ MangaApp: フォーム画面に移行完了')
  }

  const resetApp = () => {
    console.log('🔄 MangaApp: アプリケーションリセット')
    setImageUrls([])
    setError(null)
    setShowSuccess(false)
    setCurrentStep("form")
    setSelectedManga(null)
    setWorkflowRunId(null)
    setIsGenerating(false)
    setUserQuestion("")
    setUserLevel("")
    
    // 保存された状態もクリア
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleMangaSelect = (manga: MangaLibraryType) => {
    setSelectedManga(manga)
    setImageUrls(manga.image_urls)
    setCurrentStep("result")
    setShowSuccess(true)
  }

  const goBackToLibrary = () => {
    setSelectedManga(null)
    setImageUrls([])
    setShowSuccess(false)
    setCurrentStep("form")
  }

  // プログレス計算
  const getOverallProgress = () => {
    if (currentStep === "form") return 10
    if (currentStep === "generating") return 50
    if (currentStep === "result") return 100
    return 0
  }

  return (
    <>
      {/* プログレスバー */}
      {currentStep !== "intro" && (
        <ProgressBar
          progress={getOverallProgress()}
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
            {/* タブナビゲーション */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setCurrentTab("generate")}
                className={`px-6 py-3 font-medium transition-colors ${
                  currentTab === "generate"
                    ? "text-[#00bcd4] border-b-2 border-[#00bcd4]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                🎨 新規作成
              </button>
              <button
                onClick={() => setCurrentTab("library")}
                className={`px-6 py-3 font-medium transition-colors ${
                  currentTab === "library"
                    ? "text-[#00bcd4] border-b-2 border-[#00bcd4]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                📚 ライブラリー
              </button>
            </div>

            {/* タブコンテンツ */}
            {currentTab === "generate" ? (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">質問を入力してください</h2>
                <MangaForm onSubmit={handleSubmit} isLoading={isGenerating} />
                {error && <ErrorMessage message={error} />}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">漫画ライブラリー</h2>
                <MangaLibrary onMangaSelect={handleMangaSelect} />
              </>
            )}
          </div>
        )}

        {currentStep === "generating" && (
          <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
            <div className="w-32 h-32 mb-6">
              <MascotCharacter type="thinking" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">AIがマンガを生成中...</h2>
            <p className="text-gray-600 mb-6">
              あなたの質問「{userQuestion}」について、<br />
              {userLevel}レベルに合わせたマンガを作成しています
            </p>
            <div className="w-full max-w-md bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-[#00bcd4] h-2 rounded-full animate-pulse" style={{width: '50%'}}></div>
            </div>
            <p className="text-sm text-gray-500">完成まで2-5分程度お待ちください</p>
            {workflowRunId && (
              <p className="text-xs text-gray-400 mt-2">ID: {workflowRunId}</p>
            )}
          </div>
        )}

        {currentStep === "result" && (
          <div className="flex-1 p-4 flex flex-col">
            {/* 選択された漫画の情報表示 */}
            {selectedManga && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-bold text-gray-800 mb-2">📖 ライブラリーから選択</h3>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>質問:</strong> {selectedManga.question}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>対象:</strong> {selectedManga.level}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>作成日:</strong> {selectedManga.created_at ? new Date(selectedManga.created_at).toLocaleString('ja-JP') : '不明'}
                </p>
              </div>
            )}

            {/* 新規生成完了の場合の情報表示 */}
            {!selectedManga && workflowRunId && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-bold text-gray-800 mb-2">🎉 新規マンガ完成！</h3>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>質問:</strong> {userQuestion}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>対象:</strong> {userLevel}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>パネル数:</strong> {imageUrls.length} コマ
                </p>
              </div>
            )}

            {showSuccess && <SuccessMessage />}
            {error && <ErrorMessage message={error} />}
            {imageUrls.length > 0 && <MangaGallery imageUrls={imageUrls} />}

            <div className="mt-6 flex gap-3">
              {selectedManga && (
                <button
                  onClick={goBackToLibrary}
                  className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-xl font-bold text-lg shadow-md hover:bg-gray-600 transition-colors"
                >
                  📚 ライブラリーに戻る
                </button>
              )}
              <button
                onClick={resetApp}
                className="flex-1 bg-[#00bcd4] text-white py-3 px-4 rounded-xl font-bold text-lg shadow-md hover:bg-[#00acc1] transition-colors"
              >
                {selectedManga ? '🎨 新規作成' : '次へ'}
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}