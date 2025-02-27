import { createServerClient } from "@/lib/supabase-server"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardCards } from "@/components/dashboard-cards"
import { TransactionsTable } from "@/components/transactions-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload } from "lucide-react"

export default async function DashboardPage() {
  const supabase = createServerClient()

  // Fetch transactions
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .limit(10)

  // Fetch card balances
  const { data: cards } = await supabase.from("cards").select("*")

  // Calculate total balance
  const totalBalance = cards?.reduce((sum, card) => sum + card.balance, 0) || 0

  // Calculate monthly spending
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const { data: monthlyTransactions } = await supabase
    .from("transactions")
    .select("amount")
    .gte("date", `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`)

  const monthlySpending =
    monthlyTransactions?.reduce((sum, tx) => sum + (tx.amount < 0 ? Math.abs(tx.amount) : 0), 0) || 0

  // Calculate runway (months of spending left based on current rate)
  const runway = monthlySpending > 0 ? Math.round((totalBalance / monthlySpending) * 10) / 10 : 0

  return (
    <div className="space-y-8">
      <DashboardHeader title="Financial Dashboard" description="Track your finances and manage your transactions">
        <Link href="/dashboard/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Receipt
          </Button>
        </Link>
      </DashboardHeader>

      <DashboardCards
        totalBalance={totalBalance}
        monthlySpending={monthlySpending}
        runway={runway}
        cards={cards || []}
      />

      <TransactionsTable transactions={transactions || []} />
    </div>
  )
}

