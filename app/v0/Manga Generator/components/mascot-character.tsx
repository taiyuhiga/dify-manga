"use client"

interface MascotCharacterProps {
  type?: "default" | "happy" | "thinking" | "reading" | "question" | "sad"
}

export function MascotCharacter({ type = "default" }: MascotCharacterProps) {
  // マスコットキャラクターのスタイルを決定
  const getCharacterStyle = () => {
    switch (type) {
      case "happy":
        return "transform rotate-6"
      case "thinking":
        return "animate-pulse"
      case "reading":
        return ""
      case "question":
        return ""
      case "sad":
        return "transform -rotate-6"
      default:
        return ""
    }
  }

  return (
    <div className={`w-full h-full ${getCharacterStyle()}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <g>
          {/* 基本的な形 - 緑色の丸 */}
          <circle cx="50" cy="50" r="40" fill="#58cc02" />

          {/* 目 */}
          {type === "thinking" ? (
            <>
              <ellipse cx="35" cy="45" rx="8" ry="10" fill="white" />
              <ellipse cx="65" cy="45" rx="8" ry="10" fill="white" />
              <ellipse cx="35" cy="45" rx="4" ry="5" fill="#333" />
              <ellipse cx="65" cy="45" rx="4" ry="5" fill="#333" />
            </>
          ) : type === "happy" ? (
            <>
              <ellipse cx="35" cy="40" rx="8" ry="8" fill="white" />
              <ellipse cx="65" cy="40" rx="8" ry="8" fill="white" />
              <path d="M35,36 Q35,44 35,44" stroke="#333" strokeWidth="2" fill="none" />
              <path d="M65,36 Q65,44 65,44" stroke="#333" strokeWidth="2" fill="none" />
              <path d="M30,55 Q50,65 70,55" stroke="#333" strokeWidth="2" fill="none" />
            </>
          ) : (
            <>
              <ellipse cx="35" cy="45" rx="8" ry="10" fill="white" />
              <ellipse cx="65" cy="45" rx="8" ry="10" fill="white" />
              <ellipse cx="35" cy="48" rx="4" ry="5" fill="#333" />
              <ellipse cx="65" cy="48" rx="4" ry="5" fill="#333" />
            </>
          )}

          {/* くちばし */}
          <path d="M50,60 L45,70 L55,70 Z" fill="#ff9600" />

          {/* アクセサリー */}
          {type === "reading" && (
            <>
              <rect x="25" y="75" width="20" height="25" fill="#ff9600" />
              <rect x="27" y="78" width="16" height="3" fill="white" />
              <rect x="27" y="83" width="16" height="3" fill="white" />
              <rect x="27" y="88" width="16" height="3" fill="white" />
            </>
          )}

          {type === "thinking" && (
            <path d="M60,25 Q70,20 75,30 Q80,40 70,45 Q65,50 60,45 Q55,40 60,25" fill="#ffde00" />
          )}

          {type === "question" && (
            <path
              d="M70,30 Q80,35 75,45 Q70,55 60,50 L65,60 L55,55 Q50,60 45,50 Q40,40 50,35 Q60,30 70,30"
              fill="white"
            />
          )}
        </g>
      </svg>
    </div>
  )
}
