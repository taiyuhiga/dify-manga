"use client"

import { MascotCharacter } from "./mascot-character"

export function SuccessMessage() {
  return (
    <div className="bg-[#e0f7fa] p-4 rounded-xl mb-4 flex items-center gap-3 border border-[#00bcd4]">
      <div className="bg-[#00bcd4] text-white rounded-full w-8 h-8 flex items-center justify-center">✓</div>
      <div className="flex-1">
        <p className="font-bold text-[#00bcd4]">正解にゃ！</p>
        <p className="text-sm text-gray-700">素晴らしい学習マンガができました</p>
      </div>
      <div className="w-12 h-12">
        <MascotCharacter type="happy" />
      </div>
    </div>
  )
}
