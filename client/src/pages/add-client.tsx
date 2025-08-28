import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { createClientSchema, CreateClientRequest, planPricing, Plan } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/use-auth";
import { UserPlus, CreditCard, ArrowLeft, Users } from "lucide-react";
import { Link } from "wouter";

export default function AddClient() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useAuthStore();

  // Fetch available plans from the API
  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
  });

  const form = useForm<CreateClientRequest>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      mobile: "",
      email: "",
      package: undefined,
      parentId: currentUser?.id || null,
      position: null
    }
  });

  const onSubmit = async (data: CreateClientRequest) => {
    setIsSubmitting(true);
    try {
      // Ensure parentId is set to current user's ID
      const clientData = {
        ...data,
        parentId: currentUser?.id || null
      };
      
      // Store client data in sessionStorage for the payment page
      sessionStorage.setItem('pendingClientData', JSON.stringify(clientData));
      
      // Navigate to payment page
      setLocation('/admin/payment');
      
      toast({
        title: "Form validated successfully",
        description: "Proceeding to payment page..."
      });
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: "Failed to process form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlan = form.watch("package");
  const selectedPlanData = plans?.find(plan => plan.name === selectedPlan);
  const planAmount = selectedPlan ? planPricing[selectedPlan] : 0;

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="lg:ml-64 transition-all duration-300">
        {/* Top Header */}
        <header className="bg-card shadow-sm border-b border-border sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 lg:ml-0 ml-12">
                <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">
                  Add New Client
                </h1>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <UserPlus className="h-6 w-6 text-primary mr-3" />
                Create New Client Account
              </CardTitle>
              <CardDescription>
                Fill in the client details below. After validation, you'll proceed to the payment page.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter client's full name" 
                            {...field} 
                            data-testid="input-client-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Username Field */}
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose a unique username for login" 
                            {...field} 
                            data-testid="input-client-username"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          This will be used for client login. Only letters, numbers, and underscores allowed.
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Password Field */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="Create a secure password" 
                            {...field} 
                            data-testid="input-client-password"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Minimum 6 characters. Can include letters, numbers, and symbols.
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Mobile Number Field */}
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter 10-digit mobile number" 
                            {...field} 
                            data-testid="input-client-mobile"
                            maxLength={10}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Enter exactly 10 digits without country code.
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Email Field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="Enter valid email address" 
                            {...field} 
                            data-testid="input-client-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Parent ID Field (Display Only) */}
                  {currentUser && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Parent ID
                      </label>
                      <div className="flex items-center p-3 border rounded-md bg-muted">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {currentUser.id} ({currentUser.name || currentUser.username})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This client will be added under your account automatically.
                      </p>
                    </div>
                  )}

                  {/* Package Selection */}
                  <FormField
                    control={form.control}
                    name="package"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Package *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-package">
                              <SelectValue placeholder="Choose a package plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {plansLoading ? (
                              <SelectItem value="loading" disabled>Loading plans...</SelectItem>
                            ) : plans && plans.length > 0 ? (
                              plans.filter(plan => plan.status === 'active').map((plan) => (
                                <SelectItem key={plan.id} value={plan.name} data-testid={`option-${plan.name.toLowerCase()}`}>
                                  {plan.name} - {plan.price}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-plans" disabled>No plans available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Choose the membership tier for this client.
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Position Selection (Optional) */}
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Position (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-position">
                              <SelectValue placeholder="Auto-assign or choose position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="left">Left Side</SelectItem>
                            <SelectItem value="right">Right Side</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Leave empty for automatic assignment to the first available position.
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Package Summary */}
                  {selectedPlan && selectedPlanData && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <CreditCard className="h-5 w-5 mr-2 text-primary" />
                        Package Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Selected Plan:</span>
                          <span className="font-medium">{selectedPlan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plan Price:</span>
                          <span className="font-medium text-green-600">
                            {selectedPlanData.price}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Business Volume:</span>
                          <span className="font-medium">
                            {selectedPlanData.businessVolume}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Referral Commission:</span>
                          <span className="font-medium">
                            {selectedPlanData.referralCommission}
                          </span>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting || !selectedPlan}
                    data-testid="button-proceed-to-payment"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}