"use client"

import { MascotCharacter } from "./mascot-character"

interface ErrorMessageProps {
  message: string
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="bg-[#ffebee] p-4 rounded-xl mb-4 flex items-center gap-3 border border-[#f44336]">
      <div className="bg-[#f44336] text-white rounded-full w-8 h-8 flex items-center justify-center">!</div>
      <div className="flex-1">
        <p className="font-bold text-[#f44336]">エラーが発生したにゃ</p>
        <p className="text-sm text-gray-700">{message}</p>
      </div>
      <div className="w-12 h-12">
        <MascotCharacter type="sad" />
      </div>
    </div>
  )
} 