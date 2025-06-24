"use client"

import { MascotCharacter } from "./mascot-character"

interface MangaGalleryProps {
  imageUrls: string[]
}

// DifyのURLをプロキシAPIのURLに変換する関数
function convertToProxyUrl(difyUrl: string): string {
  // URLエンコードしてプロキシAPI経由で取得
  const encodedUrl = encodeURIComponent(difyUrl)
  return `/api/proxy-image?url=${encodedUrl}`
}

export function MangaGallery({ imageUrls }: MangaGalleryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 flex-shrink-0">
          <MascotCharacter type="happy" />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex-1 relative">
          <div className="absolute -left-2 top-4 w-4 h-4 bg-white border-l border-b border-gray-200 transform rotate-45"></div>
          <p className="text-gray-700">すごいにゃ！とっても素敵なマンガができたにゃ〜！✨</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
        <div className="flex flex-col">
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className="w-full"
            >
              <img
                src={convertToProxyUrl(url)}
                alt={`漫画コマ ${index + 1}`}
                className="w-full h-auto object-contain block"
                style={{ display: 'block' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (target.src.includes('proxy-image')) {
                    console.warn('プロキシ経由の画像読み込み失敗、直接URLを試行:', url)
                    target.src = url
                  } else {
                    console.error('画像の読み込みに完全に失敗しました:', url)
                    target.style.display = 'none'
                  }
                }}
                onLoad={() => {
                  console.log('画像読み込み成功:', `コマ ${index + 1}`)
                }}
              />
            </div>
          ))}
        </div>

        <div className="p-4 flex justify-center items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6">
              <MascotCharacter type="default" />
            </div>
            <span className="text-sm text-gray-600">
              全 {imageUrls.length} コマ
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#e0f7fa] p-4 rounded-xl border border-[#00bcd4] flex items-start gap-3">
        <div className="w-8 h-8 flex-shrink-0">
          <MascotCharacter type="reading" />
        </div>
        <div>
          <p className="font-medium">学習のポイント</p>
          <p className="text-sm mt-1">この内容をよく理解できたら、次の問題に挑戦してみるにゃ！復習も大切にゃ〜</p>
        </div>
      </div>
    </div>
  )
} 