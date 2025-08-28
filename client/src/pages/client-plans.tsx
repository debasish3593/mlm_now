import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientSidebar } from "@/components/client-sidebar";
import { Check, X } from "lucide-react";

export default function ClientPlans() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ["/api/plans"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const formatCurrency = (amount: string | number) => {
    if (!amount) return "₹0.00 INR";
    
    // If amount is already formatted (contains ₹), return as is
    if (typeof amount === 'string' && amount.includes('₹')) {
      return amount;
    }
    
    // Otherwise format as currency
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return "₹0.00 INR";
    return `₹${numericAmount.toFixed(2)} INR`;
  };

  const getFeaturesByPlan = (planName: string) => {
    const features: { [key: string]: string[] } = {
      Silver: [
        "1 week Entrepreneurship development training (online)",
        "Per day capping 3 per 3:3=600/-",
        "Monthly 18000/-"
      ],
      Gold: [
        "10 days entrepreneurship development training (online)",
        "Per day capping 6 per 6:6=1200/-",
        "Monthly 36000/-"
      ],
      Diamond: [
        "13 days entrepreneurship development training (online)",
        "Per day capping 9 per 9:9=1800/-",
        "Monthly 54000/-"
      ]
    };
    return features[planName] || [];
  };

  return (
    <div className="flex h-screen bg-background">
      <ClientSidebar />
      
      <main className="flex-1 p-6 md:ml-0 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Plans</h1>
            <p className="text-muted-foreground">
              View available plans and your current package
            </p>
          </div>

          {/* Current Plan */}
          {user && (user as any).package && (
            <div className="mb-8">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Your Current Plan
                    <Badge variant="secondary">Active</Badge>
                  </CardTitle>
                  <CardDescription>
                    You are currently subscribed to the {(user as any).package} package
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Plans Grid */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <div className="space-y-2">
                      {[...Array(5)].map((_, j) => (
                        <Skeleton key={j} className="h-4 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : plans && Array.isArray(plans) ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan: any) => {
                const features = getFeaturesByPlan(plan.name);
                const isCurrentPlan = user ? (user as any).package === plan.name : false;
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative ${isCurrentPlan ? 'border-primary bg-primary/5' : ''}`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">
                          Current Plan
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="pt-4">
                        <div className="text-4xl font-bold">
                          {formatCurrency(plan.price)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          one-time payment
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                          <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 text-center">
                            💰 Minimum 2 ID direct sponsor compulsory for income 💰
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold">Features included:</h4>
                          <ul className="space-y-2 mt-2">
                            {features.length > 0 ? (
                              features.map((feature: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{feature}</span>
                                </li>
                              ))
                            ) : (
                              <li className="flex items-start gap-2">
                                <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-muted-foreground">No features listed</span>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                      
                      {plan.limitations && (
                        <div className="mt-6 pt-4 border-t">
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                            Plan Details:
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {plan.limitations}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No plans available at the moment.</p>
            </div>
          )}

          {/* Plan Upgrade Notice */}
          {user && (!(user as any).package || (user as any).package === 'Silver') && (
            <div className="mt-8">
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
                <CardHeader>
                  <CardTitle className="text-blue-900 dark:text-blue-100">
                    Want to upgrade your plan?
                  </CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    Contact your upline or admin to upgrade to a higher tier plan with more benefits.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}