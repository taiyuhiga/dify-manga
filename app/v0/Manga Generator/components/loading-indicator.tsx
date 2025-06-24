"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"

interface LoadingIndicatorProps {
  message: string
  progress: number
}

export function LoadingIndicator({ message, progress }: LoadingIndicatorProps) {
  // 進行状況に応じたメッセージを表示
  const getStageMessage = () => {
    if (progress < 20) return "アイデアを考え中...✏️"
    if (progress < 40) return "ストーリーを組み立て中...📝"
    if (progress < 60) return "キャラクターをデザイン中...🎨"
    if (progress < 80) return "コマを描画中...🖌️"
    return "最終調整中...もうすぐ完成！✨"
  }

  return (
    <Card className="w-full mb-8 border-indigo-200 animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-100 p-2 rounded-full">
            <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
          </div>
          <div>
            <h3 className="font-medium text-indigo-800">{message}</h3>
            <p className="text-sm text-indigo-600">{getStageMessage()}</p>
          </div>
        </div>

        <Progress value={progress} className="h-2 bg-indigo-100" />

        <div className="mt-4 grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const isActive = progress >= (i + 1) * 20
            return (
              <div
                key={i}
                className={`h-1 rounded-full ${
                  isActive ? "bg-indigo-500" : "bg-indigo-100"
                } transition-colors duration-300`}
              />
            )
          })}
        </div>

        <div className="mt-4 text-center text-sm text-indigo-600 bg-indigo-50 p-3 rounded-lg">
          <p>漫画の生成には1〜2分かかることがあります。少々お待ちください...</p>
          <p className="mt-1 text-xs">この間に、どんな内容の漫画になるか想像してみよう！</p>
        </div>
      </CardContent>
    </Card>
  )
}
