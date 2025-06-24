"use client"

interface ErrorMessageProps {
  message: string
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="bg-[#ffdfe0] p-4 rounded-xl mb-4 flex items-center gap-3 border border-[#ea2b2b]">
      <div className="bg-[#ea2b2b] text-white rounded-full w-8 h-8 flex items-center justify-center">!</div>
      <div>
        <p className="font-bold text-[#ea2b2b]">エラーが発生しました</p>
        <p className="text-sm text-gray-700">{message}</p>
      </div>
    </div>
  )
}
