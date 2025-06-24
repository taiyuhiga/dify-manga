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
        <div className="w-16 h-16 flex-shrink-0">
          <MascotCharacter type="happy" />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex-1">
          <p className="text-gray-700">すごい！マンガができたよ！</p>
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
                    index === currentIndex ? "bg-[#58cc02] scale-125" : "bg-gray-300"
                  }`}
                  aria-label={`${index + 1}ページ目に移動`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 flex justify-between">
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
              >
                ←
              </button>
              <button
                onClick={goToNext}
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
              >
                →
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-[#fff6e5] p-4 rounded-xl border border-[#ffb020]">
        <p className="font-medium">学習のポイント</p>
        <p className="text-sm mt-1">この内容をよく理解できたら、次の問題に挑戦してみよう！</p>
      </div>
    </div>
  )
}
