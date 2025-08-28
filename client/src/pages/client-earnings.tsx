import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientSidebar } from "@/components/client-sidebar";
import { TrendingUp, DollarSign, Users, Gift, Calendar } from "lucide-react";

interface Earning {
  id: string;
  type: string;
  amount: string;
  description: string;
  fromClientId: string | null;
  createdAt: string;
}

interface EarningsTotal {
  total: string;
}

export default function ClientEarnings() {
  // Get user's earnings
  const { data: earnings, isLoading } = useQuery<Earning[]>({
    queryKey: ["/api/earnings"],
  });

  // Get total earnings
  const { data: totalEarnings } = useQuery<EarningsTotal>({
    queryKey: ["/api/earnings/total"],
  });

  const getEarningTypeBadge = (type: string) => {
    const variants = {
      referral: { variant: "default" as const, icon: Users, label: "Referral" },
      tree: { variant: "secondary" as const, icon: TrendingUp, label: "Tree Commission" },
      bonus: { variant: "outline" as const, icon: Gift, label: "Bonus" },
    };
    
    const config = variants[type as keyof typeof variants] || variants.referral;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: string) => {
    // If amount is already formatted (contains ₹), return as is
    if (amount && amount.includes('₹')) {
      return amount;
    }
    
    // Otherwise format as currency
    const numericAmount = parseFloat(amount || "0");
    if (isNaN(numericAmount)) return "₹0.00 INR";
    return `₹${numericAmount.toFixed(2)} INR`;
  };

  // Calculate earnings by type
  const earningsByType = earnings?.reduce((acc, earning) => {
    const type = earning.type;
    if (!acc[type]) {
      acc[type] = { count: 0, total: 0 };
    }
    acc[type].count += 1;
    
    // Extract numeric value from formatted currency
    const amount = earning.amount.replace(/[₹,\s]/g, '').split(' ')[0];
    acc[type].total += parseFloat(amount) || 0;
    
    return acc;
  }, {} as Record<string, { count: number; total: number }>) || {};

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <ClientSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Earnings</h1>
            <p className="text-gray-600 dark:text-gray-300">Track your commission and bonus earnings</p>
          </div>

          {/* Earnings Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(totalEarnings?.total || "0")}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Referral Earnings</p>
                    <p className="text-2xl font-bold">
                      ₹{(earningsByType.referral?.total || 0).toFixed(2)} INR
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {earningsByType.referral?.count || 0} transactions
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tree Commission</p>
                    <p className="text-2xl font-bold">
                      ₹{(earningsByType.tree?.total || 0).toFixed(2)} INR
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {earningsByType.tree?.count || 0} transactions
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bonus Earnings</p>
                    <p className="text-2xl font-bold">
                      ₹{(earningsByType.bonus?.total || 0).toFixed(2)} INR
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {earningsByType.bonus?.count || 0} transactions
                    </p>
                  </div>
                  <Gift className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Earnings</TabsTrigger>
              <TabsTrigger value="referral">Referral</TabsTrigger>
              <TabsTrigger value="tree">Tree Commission</TabsTrigger>
              <TabsTrigger value="bonus">Bonus</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <div className="grid gap-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : earnings && earnings.length > 0 ? (
                <div className="space-y-4">
                  {earnings.map((earning) => (
                    <Card key={earning.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div>
                                <h3 className="font-semibold text-lg">{earning.description}</h3>
                                <p className="text-muted-foreground text-sm flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(earning.createdAt).toLocaleString()}
                                </p>
                              </div>
                              {getEarningTypeBadge(earning.type)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {formatCurrency(earning.amount)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No earnings yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your network to earn commissions and bonuses
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Filter tabs for each earning type */}
            {['referral', 'tree', 'bonus'].map((type) => (
              <TabsContent key={type} value={type} className="space-y-4">
                {earnings?.filter(e => e.type === type).length > 0 ? (
                  <div className="space-y-4">
                    {earnings.filter(e => e.type === type).map((earning) => (
                      <Card key={earning.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h3 className="font-semibold text-lg">{earning.description}</h3>
                                  <p className="text-muted-foreground text-sm flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(earning.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                {getEarningTypeBadge(earning.type)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(earning.amount)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No {type} earnings yet</h3>
                      <p className="text-muted-foreground">
                        {type === 'referral' && "Refer new clients to earn referral commissions"}
                        {type === 'tree' && "Build your binary tree to earn tree commissions"}
                        {type === 'bonus' && "Achieve milestones to earn bonus rewards"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}