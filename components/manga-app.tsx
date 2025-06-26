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
  const [, setShowIntro] = useState(true)
  const [currentStep, setCurrentStep] = useState<"intro" | "form" | "generating" | "result">("intro")
  const [currentTab, setCurrentTab] = useState<"generate" | "library">("generate")
  const [selectedManga, setSelectedManga] = useState<MangaLibraryType | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Difyワークフロー関連の状態
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // ストリーミング生成関連の状態
  const [isStreamingMode, setIsStreamingMode] = useState(true) // ストリーミングモードの有効/無効
  const [streamingPanels, setStreamingPanels] = useState<Array<{
    panel_id: number;
    image_url: string;
    title: string;
    description: string;
  }>>([])
  const [streamingProgress, setStreamingProgress] = useState<{
    current_panel: number;
    total_panels: number;
    percentage: number;
    message: string;
  } | null>(null)
  const [, setStreamingComplete] = useState(false)
  
  // 状態永続化のためのキー
  const STORAGE_KEY = 'dify-manga-app-state'
  
  // 状態をlocalStorageに保存
  const saveState = () => {
    if (!isClient) return
    
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
      console.log('💾 状態を保存しました:', {
        currentStep: stateToSave.currentStep,
        currentTab: stateToSave.currentTab,
        hasQuestion: !!stateToSave.userQuestion,
        hasImages: stateToSave.imageUrls.length > 0,
        isGenerating: stateToSave.isGenerating
      })
    } catch (error) {
      console.error('❌ 状態保存エラー:', error)
    }
  }
  
  // localStorageから状態を復元
  const loadState = () => {
    if (!isClient) return null
    
    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (!savedState) {
        console.log('📂 保存された状態が見つかりませんでした')
        return null
      }
      
      const parsed = JSON.parse(savedState)
      
      // 24時間以上経過した状態は破棄
      if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY)
        console.log('🕒 古い状態を破棄しました')
        return null
      }
      
      console.log('📂 状態を復元しました:', {
        currentStep: parsed.currentStep,
        currentTab: parsed.currentTab,
        hasQuestion: !!parsed.userQuestion,
        hasImages: parsed.imageUrls?.length > 0,
        isGenerating: parsed.isGenerating,
        timestamp: new Date(parsed.timestamp).toLocaleString()
      })
      return parsed
    } catch (error) {
      console.error('❌ 状態復元エラー:', error)
      localStorage.removeItem(STORAGE_KEY) // 破損したデータを削除
      return null
    }
  }

  // クライアントサイドでのマウントを検出
  useEffect(() => {
    setIsClient(true)
  }, [])

  // コンポーネントマウント時に状態を復元または初期化
  useEffect(() => {
    if (!isClient) return

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
    
    setIsInitialized(true)
    console.log('✅ MangaApp: 初期化完了')
  }, [isClient])

  // 認証状態の変更を監視
  useEffect(() => {
    if (!isClient) return

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 MangaApp: 認証状態変更 -', event, session?.user?.email)
      
      // ログアウト時のみ状態をクリア
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
        setCurrentTab("generate")
        setIsInitialized(false) // 初期化フラグもリセット
      }
      
      // サインインイベントでは何もしない（状態復元は初期化時に実行）
    })

    return () => subscription.unsubscribe()
  }, [isClient])
  
  // 状態が変更されたときに自動保存
  useEffect(() => {
    // 初期化完了後のみ保存（無限ループを防ぐ）
    if (isClient && isInitialized) {
      saveState()
    }
  }, [isClient, isInitialized, currentStep, userQuestion, userLevel, imageUrls, showSuccess, currentTab, workflowRunId, isGenerating])
  
  // ページ離脱時とvisibility変更時に状態を保存
  useEffect(() => {
    if (!isClient) return

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
  }, [isClient])

  // ストリーミング生成処理
  const handleStreamingSubmit = async (question: string, level: string) => {
    setUserQuestion(question)
    setUserLevel(level)
    setError(null)
    setImageUrls([])
    setStreamingPanels([])
    setShowSuccess(false)
    setCurrentStep("generating")
    setIsGenerating(true)
    setStreamingComplete(false)
    setStreamingProgress(null)

    try {
      console.log('🎯 Starting streaming manga generation...')
      
      // SSEを使用してストリーミング生成を開始
      const response = await fetch("/api/streaming-manga-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_question: question,
          user_level: level,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Response body is not readable')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('✅ Streaming completed')
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('event: ') && lines[lines.indexOf(line) + 1]?.startsWith('data: ')) {
            const eventType = line.substring(7)
            const dataLine = lines[lines.indexOf(line) + 1]
            const data = JSON.parse(dataLine.substring(6))

            console.log('📨 SSE Event:', eventType, data)

            switch (eventType) {
              case 'start':
                setStreamingProgress({
                  current_panel: 0,
                  total_panels: 0,
                  percentage: 0,
                  message: data.message
                })
                break

              case 'planning':
                setStreamingProgress(() => ({
                  current_panel: 0,
                  total_panels: 0,
                  percentage: 0,
                  message: data.message
                }))
                break

              case 'plan_complete':
                setStreamingProgress(() => ({
                  current_panel: 0,
                  total_panels: data.total_panels,
                  percentage: 0,
                  message: `${data.total_panels}コマの漫画を生成開始...`
                }))
                break

              case 'panel_generating':
                setStreamingProgress(prev => ({
                  current_panel: data.panel_id,
                  total_panels: prev?.total_panels || data.total_panels || 0,
                  percentage: data.progress,
                  message: data.message
                }))
                break

              case 'panel_complete':
                setStreamingPanels(prev => [...prev, data])
                setStreamingProgress(prev => ({
                  current_panel: data.panel_id,
                  total_panels: prev?.total_panels || 0,
                  percentage: Math.round((data.panel_id / (prev?.total_panels || 1)) * 100),
                  message: `コマ ${data.panel_id} が完成しました`
                }))
                break

              case 'complete':
                console.log('🎉 All panels completed!')
                setStreamingComplete(true)
                setIsGenerating(false)
                setCurrentStep("result")
                setShowSuccess(true)
                
                // 最終的な画像URLリストを設定（既存のコンポーネントとの互換性のため）
                const finalImageUrls = data.panels.map((panel: { image_url: string }) => panel.image_url)
                setImageUrls(finalImageUrls)
                break

              case 'error':
                throw new Error(data.error)

              case 'panel_error':
                console.warn('⚠️ Panel generation error:', data)
                // エラーがあっても続行
                break
            }
          }
        }
      }

    } catch (err) {
      console.error('❌ Streaming generation error:', err)
      
      let errorMessage = "ストリーミング生成に失敗しました";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage)
      setIsGenerating(false)
      setCurrentStep("form")
      
      // フォールバック: 従来の方法で生成を試行
      console.log('🔄 Falling back to traditional generation...')
      handleSubmit(question, level)
    }
  }

  // 従来のDifyワークフロー処理（フォールバック用）
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
        
        if (data.status === 'succeeded_but_empty') {
          console.error('❌ Workflow succeeded but returned no images.', data.message);
          throw new Error(data.message || '漫画は生成されましたが、画像URLが空でした。');
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
    if (isClient) {
      localStorage.removeItem(STORAGE_KEY)
    }
    
    // 初期化フラグは保持（resetは状態をクリアするだけで、再初期化ではない）
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

  // SSRとクライアントのハイドレーション不一致を防ぐため、クライアントマウント完了まで待機
  if (!isClient) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="w-32 h-32 mb-6">
          <MascotCharacter type="thinking" />
        </div>
        <p className="text-gray-600">読み込み中...</p>
      </main>
    )
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
                
                {/* ストリーミングモード切り替え */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="streaming-mode"
                      checked={isStreamingMode}
                      onChange={(e) => setIsStreamingMode(e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <label htmlFor="streaming-mode" className="text-sm font-medium text-gray-700">
                      🚀 リアルタイム生成モード（推奨）
                    </label>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {isStreamingMode 
                      ? "コマが完成次第、順次表示されます" 
                      : "従来の方式で全コマ完成後に一括表示されます"
                    }
                  </p>
                </div>

                <MangaForm 
                  onSubmit={isStreamingMode ? handleStreamingSubmit : handleSubmit} 
                  isLoading={isGenerating} 
                />
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
          <div className="flex-1 p-4">
            {/* ストリーミングモードの場合 */}
            {isStreamingMode ? (
              <div className="space-y-6">
                {/* 進行状況ヘッダー */}
                <div className="text-center">
                  <div className="w-32 h-32 mb-6 mx-auto">
                    <MascotCharacter type="thinking" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">AIがマンガを生成中...</h2>
                  <p className="text-gray-600">
                    「{userQuestion}」について、{userLevel}レベルに合わせたマンガを作成中
                  </p>
                </div>

                {/* 詳細進行状況 */}
                {streamingProgress && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        {streamingProgress.message}
                      </span>
                      <span className="text-sm text-gray-500">
                        {streamingProgress.current_panel > 0 && streamingProgress.total_panels > 0
                          ? `${streamingProgress.current_panel}/${streamingProgress.total_panels}`
                          : ''
                        }
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-[#00bcd4] h-3 rounded-full transition-all duration-500"
                        style={{width: `${streamingProgress.percentage}%`}}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {streamingProgress.percentage}% 完了
                    </div>
                  </div>
                )}

                {/* 完成したコマをリアルタイム表示 */}
                {streamingPanels.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800">
                      完成したコマ ({streamingPanels.length} / {streamingProgress?.total_panels || '?'})
                    </h3>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                      <div className="flex flex-col">
                        {streamingPanels.map((panel, index) => (
                          <div key={panel.panel_id} className="relative">
                            <img
                              src={panel.image_url}
                              alt={`コマ ${panel.panel_id}: ${panel.title}`}
                              className="w-full h-auto object-contain block"
                              style={{ display: 'block' }}
                              onError={(e) => {
                                console.error('画像読み込みエラー:', panel.image_url)
                                const target = e.target as HTMLImageElement
                                
                                // プレースホルダー画像が失敗した場合はSVGプレースホルダーを表示
                                if (panel.image_url === '/placeholder-manga.png') {
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2YwZjBmMCIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjYiPgogICAgY29tYSDjgrPjg57jgZXjgpzjgZfjgabkuIvjgZXjgYQKICA8L3RleHQ+Cjwvc3ZnPg=='
                                } else {
                                  // その他の画像の場合はプレースホルダー画像にフォールバック
                                  target.src = '/placeholder-manga.png'
                                }
                              }}
                            />
                            <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                              {panel.panel_id}
                            </div>
                            {/* 新着表示アニメーション */}
                            {index === streamingPanels.length - 1 && (
                              <div className="absolute inset-0 border-4 border-green-400 rounded animate-pulse pointer-events-none"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 従来のモード */
              <div className="flex-1 flex flex-col items-center justify-center text-center">
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