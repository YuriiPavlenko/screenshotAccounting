"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import type { Database } from "@/lib/database.types"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: "Only whitelisted emails can access this application.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Finance Tracker</CardTitle>
          <CardDescription>Track your finances by uploading screenshots of your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button onClick={handleGoogleLogin} disabled={isLoading} className="w-full">
              {isLoading ? "Signing in..." : "Sign in with Google"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
          <p>Only whitelisted emails can access this application</p>
        </CardFooter>
      </Card>
    </div>
  )
}

