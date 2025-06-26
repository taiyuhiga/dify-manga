"use client"

import React from "react"
import { MangaLibrary as MangaLibraryType } from "@/lib/supabase"
import { MascotCharacter } from "./mascot-character"

interface DeleteConfirmationModalProps {
  manga: MangaLibraryType | null
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

export function DeleteConfirmationModal({
  manga,
  isOpen,
  onConfirm,
  onCancel,
  isDeleting
}: DeleteConfirmationModalProps) {
  if (!isOpen || !manga) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        {/* ヘッダー */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 flex-shrink-0">
            <MascotCharacter type="sad" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-2">⚠️ 削除確認</h2>
            <p className="text-gray-600 text-sm">
              以下の漫画を本当に削除しますか？この操作は取り消せません。
            </p>
          </div>
        </div>

        {/* 漫画情報 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex gap-4">
            {/* サムネイル */}
            {manga.image_urls && manga.image_urls.length > 0 && (
              <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                <img
                  src={manga.image_urls[0]}
                  alt={manga.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-manga.png'
                  }}
                />
              </div>
            )}
            
            {/* 詳細 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1">
                {manga.title}
              </h3>
              <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                📝 {manga.question}
              </p>
              <p className="text-xs text-blue-600 mb-1">
                🎯 {manga.level}
              </p>
              <p className="text-xs text-gray-500">
                🖼️ {manga.image_urls.length}枚の画像
              </p>
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                削除中...
              </>
            ) : (
              <>
                🗑️ 削除する
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}