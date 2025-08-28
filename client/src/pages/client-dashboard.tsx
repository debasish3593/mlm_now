import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientSidebar } from "@/components/client-sidebar";
import { PackageBadge } from "@/components/package-badge";
import { Users, TrendingUp, CreditCard, FileText } from "lucide-react";

export default function ClientDashboard() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: downlineClients } = useQuery({
    queryKey: ["/api/clients/downline"],
  });

  const { data: earnings } = useQuery({
    queryKey: ["/api/earnings"],
  });

  const { data: totalEarnings } = useQuery({
    queryKey: ["/api/earnings/total"],
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["/api/withdrawals"],
  });

  const { data: reports } = useQuery({
    queryKey: ["/api/reports"],
  });

  const pendingWithdrawals = withdrawals ? withdrawals.filter((w: any) => w.status === "pending").length : 0;
  const pendingReports = reports ? reports.filter((r: any) => r.status === "pending").length : 0;

  return (
    <div className="flex h-screen bg-background">
      <ClientSidebar />
      
      <main className="flex-1 p-6 md:ml-0 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user ? (user.name || user.username) : "Guest"}!
            </p>
          </div>

          {/* User Info Card */}
          <div className="grid gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your current account details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-lg font-semibold">{user ? (user.name || "Not set") : "Loading..."}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Username</p>
                    <p className="text-lg font-semibold">{user ? user.username : "Loading..."}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-lg font-semibold">{user ? (user.email || "Not set") : "Loading..."}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Package</p>
                    {user && user.package ? (
                      <PackageBadge package={user.package} />
                    ) : (
                      <Badge variant="secondary">No package</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Earnings
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalEarnings ? totalEarnings.total : "₹0.00 INR"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lifetime earnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Downline Members
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {downlineClients ? downlineClients.length : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Direct referrals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Withdrawals
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingWithdrawals}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Open Reports
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingReports}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pending issues
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Earnings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Earnings</CardTitle>
                <CardDescription>Your latest earning entries</CardDescription>
              </CardHeader>
              <CardContent>
                {earnings && Array.isArray(earnings) ? (
                  <div className="space-y-4">
                    {earnings.slice(0, 5).map((earning: any) => (
                      <div key={earning.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{earning.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(earning.createdAt).toLocaleDateString()} • {earning.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{earning.amount}</p>
                        </div>
                      </div>
                    ))}
                    {earnings.length === 0 && (
                      <p className="text-muted-foreground">No earnings yet</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-3 w-[150px]" />
                        </div>
                        <Skeleton className="h-4 w-[80px]" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Downline Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Downline Members</CardTitle>
                <CardDescription>Your latest referrals</CardDescription>
              </CardHeader>
              <CardContent>
                {downlineClients && Array.isArray(downlineClients) ? (
                  <div className="space-y-4">
                    {downlineClients.slice(0, 5).map((client: any) => (
                      <div key={client.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{client.name || client.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(client.createdAt).toLocaleDateString()} • {client.position} position
                          </p>
                        </div>
                        <div>
                          <PackageBadge package={client.package} />
                        </div>
                      </div>
                    ))}
                    {downlineClients.length === 0 && (
                      <p className="text-muted-foreground">No downline members yet</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-3 w-[100px]" />
                        </div>
                        <Skeleton className="h-5 w-[60px]" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}