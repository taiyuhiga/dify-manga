"use client"

import type React from "react"

import { useState } from "react"
import { MascotCharacter } from "./mascot-character"

interface MangaFormProps {
  onSubmit: (question: string, level: string) => void
  isLoading: boolean
}

export function MangaForm({ onSubmit, isLoading }: MangaFormProps) {
  const [userQuestion, setUserQuestion] = useState("")
  const [userLevel, setUserLevel] = useState("")
  const [activeField, setActiveField] = useState<"question" | "level" | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userQuestion && userLevel) {
      onSubmit(userQuestion, userLevel)
    }
  }

  const examples = [
    { question: "日本の歴史上の人物について教えて", level: "中学生" },
    { question: "英語の5文型について教えて", level: "高校生" },
    { question: "光合成のしくみを教えて", level: "小学6年生" },
    { question: "方程式の解き方を教えて", level: "中学2年生" },
  ]

  const setExample = (index: number) => {
    setUserQuestion(examples[index].question)
    setUserLevel(examples[index].level)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 flex-shrink-0">
          <MascotCharacter type="question" />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex-1">
          <p className="text-gray-700">知りたいことを教えてね！</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            onFocus={() => setActiveField("question")}
            onBlur={() => setActiveField(null)}
            required
            placeholder="例：二次方程式の解き方について教えて"
            disabled={isLoading}
            className="w-full p-4 rounded-2xl border border-gray-300 focus:border-[#58cc02] focus:ring-2 focus:ring-[#58cc02] focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={userLevel}
            onChange={(e) => setUserLevel(e.target.value)}
            onFocus={() => setActiveField("level")}
            onBlur={() => setActiveField(null)}
            required
            placeholder="あなたの学年・レベル（例：中学2年生）"
            disabled={isLoading}
            className="w-full p-4 rounded-2xl border border-gray-300 focus:border-[#58cc02] focus:ring-2 focus:ring-[#58cc02] focus:outline-none transition-colors"
          />
        </div>

        {activeField === "question" && (
          <div className="bg-[#fff6e5] p-4 rounded-xl border border-[#ffb020] text-sm">
            <p>どんな内容について知りたいか、具体的に書いてみよう！</p>
          </div>
        )}

        {activeField === "level" && (
          <div className="bg-[#fff6e5] p-4 rounded-xl border border-[#ffb020] text-sm">
            <p>学年や理解レベルを教えてくれると、ちょうどいい説明ができるよ！</p>
          </div>
        )}

        <div className="pt-2">
          <p className="text-sm text-gray-500 mb-2">例を試してみる：</p>
          <div className="grid grid-cols-2 gap-2">
            {examples.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setExample(index)}
                disabled={isLoading}
                className="text-xs p-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-left"
              >
                {example.question}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !userQuestion || !userLevel}
          className="w-full bg-[#58cc02] text-white py-3 px-4 rounded-xl font-bold text-lg shadow-md hover:bg-[#46a302] disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
        >
          {isLoading ? "生成中..." : "チェック"}
        </button>
      </form>
    </div>
  )
}
