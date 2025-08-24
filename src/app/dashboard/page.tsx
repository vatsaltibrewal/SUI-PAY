"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useApp } from "@/components/providers/AuthProvider"
import { Share2, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts"
import { TransactionsTable } from "@/components/transactions-table"
import { ShareLinkModal } from "@/components/share-link-modal"
import { useToast } from "@/hooks/use-toast"

interface AnalyticsData {
  overview: {
    totalAmount: number
    averageAmount: number
    totalPayments: number
    uniqueDonors: number
    period: number
  }
  recentPayments: Array<{
    id: string
    amount: number
    message?: string
    donorName?: string
    isAnonymous: boolean
    timestamp: string
  }>
  chartData: Array<{
    date: string
    amount: number
    payments: number
    donors: number
  }>
}

export default function DashboardPage() {
  const { user, token, creator, isLoading } = useApp()
  const [showShareModal, setShowShareModal] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Redirect if not authenticated (but only after auth state has loaded)
  useEffect(() => {
    if (!isLoading && !user.name && !creator) {
      console.log('Dashboard: No authentication found, redirecting to home')
      window.location.href = "/"
      return
    }
  }, [user, creator, isLoading])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // If we have a creator (backend authenticated), fetch real data
        if (creator && token) {
          console.log('Dashboard: Fetching real data for creator:', creator.id)
          const [analyticsRes, paymentsRes] = await Promise.all([
            fetch('/api/creator/analytics?type=overview&period=30', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }),
            fetch('/api/creator/payments?limit=10', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })
          ])

          if (analyticsRes.ok) {
            const analyticsData = await analyticsRes.json()
            console.log('Dashboard: Analytics data:', analyticsData)
            setAnalytics(analyticsData)
          } else {
            console.warn('Dashboard: Failed to fetch analytics:', analyticsRes.status)
          }

          if (paymentsRes.ok) {
            const paymentsData = await paymentsRes.json()
            console.log('Dashboard: Payments data:', paymentsData)
            // Transform payments to match the expected format
            const transformedTransactions = paymentsData.payments?.map((payment: any) => ({
              id: payment.id,
              sender: payment.donorName || payment.fromAddress,
              amount: payment.amount,
              time: payment.timestamp,
              type: payment.donorName ? "suins" : "wallet"
            })) || []
            setTransactions(transformedTransactions)
          } else {
            console.warn('Dashboard: Failed to fetch payments:', paymentsRes.status)
          }
        } else {
          // Fallback: Generate some sample data for demo (if only V0 user data exists)
          console.log('Dashboard: No backend creator, showing demo data')
          const sampleAnalytics: AnalyticsData = {
            overview: {
              totalAmount: 0,
              averageAmount: 0,
              totalPayments: 0,
              uniqueDonors: 0,
              period: 30
            },
            recentPayments: [],
            chartData: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              amount: 0,
              payments: 0,
              donors: 0
            }))
          }
          setAnalytics(sampleAnalytics)
          setTransactions([])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast({
          title: "Error Loading Data",
          description: "Could not load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [creator, token, toast])

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold text-muted-foreground uppercase">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold text-muted-foreground uppercase">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  const userIdentifier =
    user.username?.replace("@", "").replace(".suins", "") || user.walletAddress?.slice(2, 10) || "user"

  const displayName = user.name || user.username || "Anonymous User"
  const displayId =
    user.username ||
    (user.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : "No ID")
  const profilePicture = user.profilePicture || "/user-profile-illustration.png"

  const totalEarnings = analytics?.overview.totalAmount || 0
  const chartData = analytics?.chartData || []

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-border bg-background p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground uppercase">SUIPAY</h1>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowShareModal(true)}
              className="brutalist-button bg-primary text-primary-foreground font-bold text-sm uppercase hover:bg-primary px-4 py-2 h-10"
            >
              <Share2 className="mr-2 h-4 w-4" />
              SHARE LINK
            </Button>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground uppercase">{displayName}</p>
                <p className="text-xs text-muted-foreground font-medium">{displayId}</p>
              </div>
              <Avatar className="w-10 h-10 brutalist-border">
                <AvatarImage src={profilePicture || "/placeholder.svg"} alt={displayName} />
                <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Stats Cards */}
        {analytics && (
          <div className="grid grid-cols-3 gap-6">
            <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-cyan-400 mb-2">{analytics.overview.totalPayments}</p>
                <p className="text-sm font-bold text-black uppercase tracking-wide">Payments</p>
              </CardContent>
            </Card>
            <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-cyan-400 mb-2">{analytics.overview.uniqueDonors}</p>
                <p className="text-sm font-bold text-black uppercase tracking-wide">Supporters</p>
              </CardContent>
            </Card>
            <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-cyan-400 mb-2">${analytics.overview.averageAmount.toFixed(2)}</p>
                <p className="text-sm font-bold text-black uppercase tracking-wide">Average</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Earnings Card */}
        <Card className="brutalist-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-card-foreground uppercase flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              This Month's Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 px-6 pb-6">
            <div className="text-4xl font-bold text-card-foreground mb-6">${totalEarnings.toFixed(2)}</div>
            <div className="h-80 w-full bg-white rounded-lg p-4 ml-6">
              <div className="h-full w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 40, bottom: 10 }}>
                      <CartesianGrid
                        strokeDasharray="none"
                        stroke="#000000"
                        strokeWidth={1}
                        horizontal={true}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={{ stroke: "#000000", strokeWidth: 2 }}
                        tickLine={{ stroke: "#000000", strokeWidth: 2 }}
                        tick={{ fontSize: 12, fontWeight: "bold", fill: "#000000" }}
                        interval={4}
                        tickFormatter={(value) => new Date(value).getDate().toString()}
                      />
                      <YAxis
                        axisLine={{ stroke: "#000000", strokeWidth: 2 }}
                        tickLine={{ stroke: "#000000", strokeWidth: 2 }}
                        tick={{ fontSize: 12, fontWeight: "bold", fill: "#000000" }}
                        tickFormatter={(value) => `$${value}`}
                        domain={[0, "dataMax + 20"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#00D1FF"
                        strokeWidth={4}
                        dot={{
                          fill: "#00D1FF",
                          strokeWidth: 3,
                          r: 5,
                          stroke: "#000000",
                        }}
                        activeDot={{
                          r: 8,
                          fill: "#00D1FF",
                          strokeWidth: 3,
                          stroke: "#000000",
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-muted-foreground font-semibold">No earnings data yet</p>
                  </div>
                )}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="brutalist-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-card-foreground uppercase">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {transactions.length > 0 ? (
              <TransactionsTable transactions={transactions} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground font-semibold">No transactions yet</p>
                <p className="text-sm text-muted-foreground mt-2">Share your link to start receiving payments!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        userIdentifier={userIdentifier}
        walletAddress={user.walletAddress}
      />
    </div>
  )
}