"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Transaction {
  id: string
  sender: string
  amount: number
  time: string
  type: "suins" | "wallet"
}

interface TransactionsTableProps {
  transactions: Transaction[]
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const totalPages = Math.ceil(transactions.length / itemsPerPage)

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = transactions.slice(startIndex, endIndex)

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatSender = (sender: string, type: "suins" | "wallet") => {
    if (type === "wallet") {
      return `${sender.slice(0, 6)}...${sender.slice(-4)}`
    }
    return sender
  }

  return (
    <div className="space-y-6">
      <div className="brutalist-border bg-background rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-border hover:bg-transparent">
              <TableHead className="font-bold text-foreground uppercase text-xs py-4 px-6">Sender</TableHead>
              <TableHead className="font-bold text-foreground uppercase text-xs py-4 px-6">Amount</TableHead>
              <TableHead className="font-bold text-foreground uppercase text-xs text-right py-4 px-6">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTransactions.map((transaction) => (
              <TableRow key={transaction.id} className="border-b border-border hover:bg-muted/50">
                <TableCell className="font-semibold text-base py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-foreground">{formatSender(transaction.sender, transaction.type)}</span>
                    <Badge
                      variant={transaction.type === "suins" ? "default" : "secondary"}
                      className="text-xs font-bold uppercase"
                    >
                      {transaction.type}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-primary text-base py-4 px-6">${transaction.amount.toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground font-medium text-base text-right py-4 px-6">
                  {formatTime(transaction.time)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-semibold">
            Showing {startIndex + 1}-{Math.min(endIndex, transactions.length)} of {transactions.length} transactions
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="brutalist-button bg-card text-card-foreground hover:bg-card"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground">
              {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="brutalist-button bg-card text-card-foreground hover:bg-card"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}