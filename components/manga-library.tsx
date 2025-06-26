"use client"

import { useState, useEffect } from "react"
import { MangaLibrary as MangaLibraryType } from "@/lib/supabase"
import { MascotCharacter } from "./mascot-character"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"

interface MangaLibraryProps {
  onMangaSelect?: (manga: MangaLibraryType) => void
}

export function MangaLibrary({ onMangaSelect }: MangaLibraryProps) {
  const [mangas, setMangas] = useState<MangaLibraryType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // 削除機能の状態
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    manga: MangaLibraryType | null
    isDeleting: boolean
  }>({
    isOpen: false,
    manga: null,
    isDeleting: false
  })
  
  // 編集機能の状態
  const [editingManga, setEditingManga] = useState<{
    id: string
    title: string
  } | null>(null)

  // 検索・フィルター機能の状態
  const [searchQuery, setSearchQuery] = useState("")
  const [levelFilter, setLevelFilter] = useState("")
  const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filteredMangas, setFilteredMangas] = useState<MangaLibraryType[]>([])

  useEffect(() => {
    loadMangaLibrary()
  }, [])

  // 検索・フィルター機能
  useEffect(() => {
    let filtered = [...mangas]

    // テキスト検索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(manga =>
        manga.title.toLowerCase().includes(query) ||
        manga.question.toLowerCase().includes(query) ||
        manga.level.toLowerCase().includes(query)
      )
    }

    // レベルフィルター
    if (levelFilter) {
      filtered = filtered.filter(manga => manga.level === levelFilter)
    }

    // ソート
    filtered.sort((a, b) => {
      let aValue: string | Date, bValue: string | Date

      if (sortBy === 'created_at') {
        aValue = new Date(a.created_at || '')
        bValue = new Date(b.created_at || '')
      } else {
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
      }

      let comparison = 0
      if (aValue < bValue) comparison = -1
      if (aValue > bValue) comparison = 1

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredMangas(filtered)
  }, [mangas, searchQuery, levelFilter, sortBy, sortOrder])

  // ユニークなレベル一覧を取得
  const uniqueLevels = Array.from(new Set(mangas.map(manga => manga.level))).sort()

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

  // 削除機能
  const handleDeleteClick = (manga: MangaLibraryType, e: React.MouseEvent) => {
    e.stopPropagation() // カード選択を防ぐ
    setDeleteModal({
      isOpen: true,
      manga: manga,
      isDeleting: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.manga) return

    setDeleteModal(prev => ({ ...prev, isDeleting: true }))

    try {
      const response = await fetch(`/api/manga-library/${deleteModal.manga.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // 楽観的UI更新
        setMangas(prev => prev.filter(m => m.id !== deleteModal.manga!.id))
        setSuccessMessage('漫画が削除されました')
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        throw new Error(data.error || '削除に失敗しました')
      }
    } catch (error) {
      console.error('削除エラー:', error)
      setError(error instanceof Error ? error.message : '削除に失敗しました')
      setTimeout(() => setError(null), 5000)
    } finally {
      setDeleteModal({
        isOpen: false,
        manga: null,
        isDeleting: false
      })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      manga: null,
      isDeleting: false
    })
  }

  // 編集機能
  const handleEditClick = (manga: MangaLibraryType, e: React.MouseEvent) => {
    e.stopPropagation() // カード選択を防ぐ
    setEditingManga({
      id: manga.id!,
      title: manga.title
    })
  }

  const handleEditSave = async () => {
    if (!editingManga) return

    try {
      const response = await fetch(`/api/manga-library/${editingManga.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editingManga.title
        })
      })

      const data = await response.json()

      if (data.success) {
        // 楽観的UI更新
        setMangas(prev => prev.map(m => 
          m.id === editingManga.id 
            ? { ...m, title: editingManga.title }
            : m
        ))
        setSuccessMessage('タイトルが更新されました')
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        throw new Error(data.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('更新エラー:', error)
      setError(error instanceof Error ? error.message : '更新に失敗しました')
      setTimeout(() => setError(null), 5000)
    } finally {
      setEditingManga(null)
    }
  }

  const handleEditCancel = () => {
    setEditingManga(null)
  }

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
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

  return (
    <div className="flex flex-col gap-4">
      {/* 成功・エラーメッセージ */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <span className="text-green-600">✅</span>
          <span className="text-green-700 text-sm">{successMessage}</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <span className="text-red-600">❌</span>
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="w-20 h-20 flex-shrink-0">
          <MascotCharacter type="happy" />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex-1">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📚 漫画ライブラリー ({filteredMangas.length}/{mangas.length}件)
          </h2>

          {/* 検索・フィルター */}
          <div className="mb-6 space-y-4">
            {/* 検索バー */}
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="タイトル、質問、レベルで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00bcd4] focus:ring-2 focus:ring-[#00bcd4] focus:outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setSearchQuery("")
                  setLevelFilter("")
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                クリア
              </button>
            </div>

            {/* フィルター・ソート */}
            <div className="flex flex-wrap gap-3">
              {/* レベルフィルター */}
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:border-[#00bcd4] focus:outline-none"
              >
                <option value="">全レベル</option>
                {uniqueLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>

              {/* ソート */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as ['created_at' | 'title', 'asc' | 'desc']
                  setSortBy(newSortBy)
                  setSortOrder(newSortOrder)
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:border-[#00bcd4] focus:outline-none"
              >
                <option value="created_at-desc">作成日（新しい順）</option>
                <option value="created_at-asc">作成日（古い順）</option>
                <option value="title-asc">タイトル（A-Z）</option>
                <option value="title-desc">タイトル（Z-A）</option>
              </select>
            </div>
          </div>
          
          {filteredMangas.length === 0 ? (
            /* 検索結果なし */
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4">
                <MascotCharacter type="sad" />
              </div>
              <p className="text-gray-600">
                {searchQuery || levelFilter 
                  ? "検索条件に一致する漫画が見つかりませんでした。"
                  : "まだ漫画がライブラリーに保存されていません。"
                }
              </p>
              {(searchQuery || levelFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setLevelFilter("")
                  }}
                  className="mt-2 px-4 py-2 bg-[#00bcd4] text-white rounded-lg hover:bg-[#00acc1] transition-colors"
                >
                  検索をクリア
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMangas.map((manga) => (
              <div 
                key={manga.id}
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-gray-50 relative group"
                onClick={() => onMangaSelect?.(manga)}
              >
                {/* アクションボタン */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEditClick(manga, e)}
                    className="bg-blue-500 text-white p-1.5 rounded-md hover:bg-blue-600 transition-colors"
                    title="タイトルを編集"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(manga, e)}
                    className="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 transition-colors"
                    title="削除"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
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
                  {editingManga?.id === manga.id ? (
                    /* 編集モード */
                    <div className="mb-1">
                      <input
                        type="text"
                        value={editingManga.title}
                        onChange={(e) => setEditingManga(prev => prev ? { ...prev, title: e.target.value } : null)}
                        onKeyDown={handleEditKeyPress}
                        onBlur={handleEditSave}
                        className="w-full text-sm font-semibold text-gray-800 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditSave()
                          }}
                          className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600"
                        >
                          保存
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditCancel()
                          }}
                          className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded hover:bg-gray-600"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 通常表示 */
                    <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">
                      {manga.title}
                    </h3>
                  )}
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
          )}
        </div>
      </div>

      {/* 削除確認モーダル */}
      <DeleteConfirmationModal
        manga={deleteModal.manga}
        isOpen={deleteModal.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  )
} 