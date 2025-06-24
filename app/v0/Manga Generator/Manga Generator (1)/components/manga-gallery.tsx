"use client"

import { useState } from "react"
import { MascotCharacter } from "./mascot-character"

interface MangaGalleryProps {
  imageUrls: string[]
}

export function MangaGallery({ imageUrls }: MangaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1))
  }

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
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-300 ${
                index === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <img
                src={url || "/placeholder.svg"}
                alt={`漫画コマ ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
          ))}

          {imageUrls.length > 1 && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
              {imageUrls.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex ? "bg-[#00bcd4] scale-125" : "bg-gray-300"
                  }`}
                  aria-label={`${index + 1}ページ目に移動`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 flex justify-between items-center">
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                ←
              </button>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6">
                  <MascotCharacter type="default" />
                </div>
                <span className="text-sm text-gray-600">
                  {currentIndex + 1} / {imageUrls.length}
                </span>
              </div>
              <button
                onClick={goToNext}
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                →
              </button>
            </>
          )}
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
