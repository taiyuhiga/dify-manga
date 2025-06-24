"use client"

interface ProgressBarProps {
  progress: number
  streak: number
}

export function ProgressBar({ progress, streak }: ProgressBarProps) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-gray-500">
          {streak > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[#ff9600]">🔥</span>
              <span className="text-sm">{streak}</span>
            </div>
          )}
        </div>
        <div className="text-gray-500 text-sm">{Math.round(progress)}%</div>
      </div>
      <div className="h-3 bg-gray-200 w-full">
        <div
          className="h-full bg-[#00bcd4] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
} 