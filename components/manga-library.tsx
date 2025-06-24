"use client"

import { useState, useEffect } from "react"
import { MangaLibrary as MangaLibraryType } from "@/lib/supabase"
import { MascotCharacter } from "./mascot-character"

interface MangaLibraryProps {
  onMangaSelect?: (manga: MangaLibraryType) => void
}

export function MangaLibrary({ onMangaSelect }: MangaLibraryProps) {
  const [mangas, setMangas] = useState<MangaLibraryType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMangaLibrary()
  }, [])

  const loadMangaLibrary = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/manga-library')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'ライブラリー取得に失敗しました')
      }
      
      setMangas(data.mangas)
      
    } catch (error) {
      console.error('❌ ライブラリー読み込みエラー:', error)
      setError(error instanceof Error ? error.message : '不明なエラー')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 flex-shrink-0">
            <MascotCharacter type="thinking" />
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex-1">
            <p className="text-gray-600">📚 漫画ライブラリーを読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 flex-shrink-0">
            <MascotCharacter type="sad" />
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex-1">
            <p className="text-red-600">❌ エラー: {error}</p>
            <button 
              onClick={loadMangaLibrary}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mangas.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 flex-shrink-0">
            <MascotCharacter type="happy" />
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex-1">
            <p className="text-gray-600">📚 まだ漫画がライブラリーに保存されていません。</p>
            <p className="text-sm text-gray-500 mt-2">質問を入力して漫画を生成すると、ここに自動的に保存されます。</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 flex-shrink-0">
          <MascotCharacter type="happy" />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex-1">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📚 漫画ライブラリー ({mangas.length}件)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mangas.map((manga) => (
              <div 
                key={manga.id}
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-gray-50"
                onClick={() => onMangaSelect?.(manga)}
              >
                {/* サムネイル画像 */}
                {manga.image_urls && manga.image_urls.length > 0 && (
                  <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-gray-200">
                    <img 
                      src={manga.image_urls[0]}
                      alt={manga.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-manga.png' // プレースホルダー画像
                      }}
                    />
                  </div>
                )}
                
                {/* 漫画情報 */}
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">
                    {manga.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-1">
                    📝 {manga.question.slice(0, 50)}...
                  </p>
                  <p className="text-xs text-blue-600 mb-2">
                    🎯 {manga.level}
                  </p>
                  <p className="text-xs text-gray-500">
                    🗓️ {manga.created_at ? formatDate(manga.created_at) : '日付不明'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    🖼️ {manga.image_urls.length}枚の画像
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 