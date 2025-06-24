"use client"

import { MascotCharacter } from "./mascot-character"

interface LoadingScreenProps {
  message: string
  progress: number
}

export function LoadingScreen({ message, progress }: LoadingScreenProps) {
  // 進行状況に応じたメッセージを表示
  const getStageMessage = () => {
    if (progress < 20) return "アイデアを考え中にゃ..."
    if (progress < 40) return "ストーリーを組み立て中にゃ..."
    if (progress < 60) return "キャラクターをデザイン中にゃ..."
    if (progress < 80) return "コマを描画中にゃ..."
    return "最終調整中にゃ...もうすぐ完成！"
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-32 h-32 mb-6">
        <MascotCharacter type="thinking" />
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2">{message}</h2>

      <p className="text-gray-600 mb-8">{getStageMessage()}</p>

      <div className="w-full max-w-md h-4 bg-gray-200 rounded-full overflow-hidden mb-8 relative">
        <div
          className="h-full bg-[#00bcd4] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
        {/* 猫の足跡アニメーション */}
        <div className="absolute top-0 left-0 h-full flex items-center">
          <div
            className="text-white text-xs transition-all duration-300 ease-out"
            style={{ marginLeft: `${Math.max(0, progress - 5)}%` }}
          >
            🐾
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">漫画の生成には1〜2分かかることがあります。</p>
        <p className="text-sm text-gray-500">この間に、どんな内容の漫画になるか想像してみるにゃ！</p>
      </div>

      {/* 猫の足跡装飾 */}
      <div className="absolute bottom-10 left-10 opacity-20">
        <div className="flex gap-4">
          <span className="text-2xl animate-pulse">🐾</span>
          <span className="text-2xl animate-pulse animation-delay-500">🐾</span>
          <span className="text-2xl animate-pulse animation-delay-1000">🐾</span>
        </div>
      </div>
    </div>
  )
} 