"use client"

import Link from "next/link"
import type { User } from "@supabase/auth-helpers-nextjs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreditCard, Home, LogOut, Upload, UserIcon } from "lucide-react"
import type { Database } from "@/lib/database.types"

interface DashboardNavProps {
  user: User
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/dashboard" className="flex items-center font-semibold">
          <CreditCard className="mr-2 h-5 w-5" />
          Finance Tracker
        </Link>

        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
            <Home className="h-4 w-4 lg:hidden" />
            <span className="hidden lg:block">Dashboard</span>
          </Link>
          <Link
            href="/dashboard/upload"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Upload className="h-4 w-4 lg:hidden" />
            <span className="hidden lg:block">Upload</span>
          </Link>
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <UserIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user.email && <p className="font-medium">{user.email}</p>}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onSelect={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

