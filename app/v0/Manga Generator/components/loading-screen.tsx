"use client"

import { MascotCharacter } from "./mascot-character"

interface LoadingScreenProps {
  message: string
  progress: number
}

export function LoadingScreen({ message, progress }: LoadingScreenProps) {
  // 進行状況に応じたメッセージを表示
  const getStageMessage = () => {
    if (progress < 20) return "アイデアを考え中..."
    if (progress < 40) return "ストーリーを組み立て中..."
    if (progress < 60) return "キャラクターをデザイン中..."
    if (progress < 80) return "コマを描画中..."
    return "最終調整中...もうすぐ完成！"
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-32 h-32 mb-6">
        <MascotCharacter type="thinking" />
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2">{message}</h2>

      <p className="text-gray-600 mb-8">{getStageMessage()}</p>

      <div className="w-full max-w-md h-4 bg-gray-200 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-[#58cc02] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p className="text-sm text-gray-500 text-center max-w-md">
        漫画の生成には1〜2分かかることがあります。
        <br />
        この間に、どんな内容の漫画になるか想像してみよう！
      </p>
    </div>
  )
}
