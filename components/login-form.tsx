"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { MascotCharacter } from "@/components/mascot-character";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Redirect to the main manga app
      router.push("/");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-[#00bcd4]/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20">
              <MascotCharacter type="happy" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-[#00bcd4]">AIマンガでログイン</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            マンガで学習を始めましょう！
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {/* Google Sign In Button */}
            <GoogleSignInButton />
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  または
                </span>
              </div>
            </div>
            
            {/* Email/Password Form */}
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="manga@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-gray-300 focus:border-[#00bcd4] focus:ring-[#00bcd4] rounded-lg"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto inline-block text-sm text-[#00bcd4] underline-offset-4 hover:underline font-medium"
                    >
                      パスワードを忘れた方
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-gray-300 focus:border-[#00bcd4] focus:ring-[#00bcd4] rounded-lg"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <span>⚠️</span>
                      {error}
                    </p>
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-[#00bcd4] hover:bg-[#00acc1] text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[0.98]" 
                  disabled={isLoading}
                >
                  {isLoading ? "ログイン中..." : "📚 メールでログイン"}
                </Button>
              </div>
            </form>
            
            <div className="text-center text-sm">
              アカウントをお持ちでない方は{" "}
              <Link
                href="/auth/sign-up"
                className="text-[#00bcd4] font-bold underline underline-offset-4 hover:text-[#00acc1] transition-colors"
              >
                🎯 新規登録
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}