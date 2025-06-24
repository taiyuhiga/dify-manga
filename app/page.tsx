import { AuthWrapper } from "@/components/auth-wrapper"
import { AuthButton } from "@/components/auth-button"
import { MangaApp } from "@/components/manga-app"

export default function HomePage() {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-white flex flex-col">
        {/* ヘッダー */}
        <header className="bg-[#00bcd4] p-4 flex items-center justify-between">
          <div className="text-white text-2xl font-bold">AIマンガ</div>
          <AuthButton />
        </header>
        
        <MangaApp />
      </div>
    </AuthWrapper>
  )
}