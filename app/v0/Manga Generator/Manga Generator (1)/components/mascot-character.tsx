"use client"

interface MascotCharacterProps {
  type?: "default" | "happy" | "thinking" | "reading" | "question" | "sad"
}

export function MascotCharacter({ type = "default" }: MascotCharacterProps) {
  // マスコットキャラクターのスタイルを決定
  const getCharacterStyle = () => {
    switch (type) {
      case "happy":
        return "transform rotate-6 animate-bounce"
      case "thinking":
        return "animate-pulse"
      case "reading":
        return "transform rotate-3"
      case "question":
        return "animate-wiggle"
      case "sad":
        return "transform -rotate-6"
      default:
        return ""
    }
  }

  const getOverlayContent = () => {
    switch (type) {
      case "thinking":
        return (
          <div className="absolute -top-2 -right-2 flex gap-1">
            <div className="w-2 h-2 bg-[#00bcd4] rounded-full animate-ping"></div>
            <div className="w-3 h-3 bg-[#00bcd4] rounded-full animate-ping animation-delay-200"></div>
            <div className="w-4 h-4 bg-[#00bcd4] rounded-full animate-ping animation-delay-400 flex items-center justify-center">
              <span className="text-white text-xs">?</span>
            </div>
          </div>
        )
      case "reading":
        return (
          <div className="absolute -bottom-2 -right-2">
            <div className="w-6 h-8 bg-[#00bcd4] rounded-sm flex flex-col items-center justify-center">
              <div className="w-4 h-1 bg-white rounded mb-1"></div>
              <div className="w-4 h-1 bg-white rounded mb-1"></div>
              <div className="w-3 h-1 bg-white rounded"></div>
            </div>
          </div>
        )
      case "question":
        return (
          <div className="absolute -top-3 -left-3">
            <div className="bg-white rounded-full p-2 shadow-md border border-[#00bcd4]">
              <span className="text-[#00bcd4] text-sm">💭</span>
            </div>
          </div>
        )
      case "happy":
        return (
          <div className="absolute -top-2 -right-2">
            <div className="flex gap-1">
              <span className="text-yellow-400 text-lg animate-pulse">✨</span>
              <span className="text-yellow-400 text-sm animate-pulse animation-delay-300">⭐</span>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={`w-full h-full relative ${getCharacterStyle()}`}>
      <div className="w-full h-full rounded-full overflow-hidden">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E9%BB%92%E7%8C%AB%20%E3%82%A4%E3%83%A9%E3%82%B9%E3%83%88%20%E3%83%95%E3%83%AA%E3%83%BC-T9QXnaDAMMHwMnIF4w1y0BqEsugpAB.jpeg"
          alt="黒猫ちゃん"
          className="w-full h-full object-cover"
        />
      </div>
      {getOverlayContent()}
    </div>
  )
}
