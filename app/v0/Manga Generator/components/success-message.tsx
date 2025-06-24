"use client"

export function SuccessMessage() {
  return (
    <div className="bg-[#e5f8d4] p-4 rounded-xl mb-4 flex items-center gap-3 border border-[#58cc02]">
      <div className="bg-[#58cc02] text-white rounded-full w-8 h-8 flex items-center justify-center">✓</div>
      <div>
        <p className="font-bold text-[#58cc02]">正解！</p>
        <p className="text-sm text-gray-700">+50ジェムを獲得しました</p>
      </div>
    </div>
  )
}
