import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ClientSidebar } from "@/components/client-sidebar";
import { CreditCard, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { createWithdrawalSchema, type CreateWithdrawalRequest } from "@shared/schema";

interface Withdrawal {
  id: string;
  amount: string;
  bankDetails: string;
  status: string;
  adminNotes: string | null;
  requestedAt: string;
  processedAt: string | null;
}

export default function ClientWithdrawals() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateWithdrawalRequest>({
    resolver: zodResolver(createWithdrawalSchema),
    defaultValues: {
      amount: "",
      bankDetails: "",
    },
  });

  // Get user's withdrawals
  const { data: withdrawals, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals"],
  });

  // Get total earnings for context
  const { data: totalEarnings } = useQuery({
    queryKey: ["/api/earnings/total"],
  });

  // Create withdrawal request mutation
  const createWithdrawalMutation = useMutation({
    mutationFn: async (data: CreateWithdrawalRequest) => {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create withdrawal request");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      form.reset();
      setShowRequestForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create withdrawal request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateWithdrawalRequest) => {
    createWithdrawalMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending" },
      approved: { variant: "default" as const, icon: CheckCircle, label: "Approved" },
      rejected: { variant: "destructive" as const, icon: XCircle, label: "Rejected" },
      completed: { variant: "default" as const, icon: CheckCircle, label: "Completed" },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
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

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <ClientSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Withdrawals</h1>
              <p className="text-gray-600 dark:text-gray-300">Request and manage your earnings withdrawals</p>
            </div>
            <Button onClick={() => setShowRequestForm(!showRequestForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Request Withdrawal
            </Button>
          </div>

          {/* Available Balance */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency((totalEarnings as any)?.total || "0")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total earnings available for withdrawal
                  </p>
                </div>
                <CreditCard className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {showRequestForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Request Withdrawal</CardTitle>
                <CardDescription>
                  Submit a request to withdraw your available earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Withdrawal Amount (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter amount to withdraw" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Account Details</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your complete bank account details including account number, IFSC code, bank name, and account holder name"
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">Important Notes</h4>
                          <ul className="text-sm text-blue-700 dark:text-blue-200 mt-1 space-y-1">
                            <li>• Withdrawal requests are processed within 2-3 business days</li>
                            <li>• Minimum withdrawal amount is ₹100</li>
                            <li>• Ensure your bank details are accurate to avoid delays</li>
                            <li>• Once submitted, requests cannot be modified</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowRequestForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={createWithdrawalMutation.isPending}
                      >
                        {createWithdrawalMutation.isPending ? "Submitting..." : "Submit Request"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Withdrawals List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Withdrawal History</h2>
            
            {isLoading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
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
            ) : withdrawals && withdrawals.length > 0 ? (
              withdrawals.map((withdrawal) => (
                <Card key={withdrawal.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {formatCurrency(withdrawal.amount)}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Requested: {new Date(withdrawal.requestedAt).toLocaleString()}
                          </p>
                          {withdrawal.processedAt && (
                            <p className="text-muted-foreground text-sm">
                              Processed: {new Date(withdrawal.processedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Bank Details:</h4>
                        <p className="text-muted-foreground text-sm whitespace-pre-line">
                          {withdrawal.bankDetails}
                        </p>
                      </div>
                      
                      {withdrawal.adminNotes && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <h4 className="font-medium mb-1">Admin Notes:</h4>
                          <p className="text-muted-foreground text-sm">{withdrawal.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No withdrawal requests</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't made any withdrawal requests yet
                  </p>
                  <Button onClick={() => setShowRequestForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Request Your First Withdrawal
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}