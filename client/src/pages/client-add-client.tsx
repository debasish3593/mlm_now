import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ClientSidebar } from "@/components/client-sidebar";
import { createClientSchema, type CreateClientRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

interface Position {
  position: "left" | "right";
  available: boolean;
}

export default function ClientAddClient() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedParent, setSelectedParent] = useState<string>("");

  const form = useForm<CreateClientRequest>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      mobile: "",
      email: "",
      package: undefined,
      parentId: "",
      position: undefined,
    },
  });

  // Get current user to use as default parent
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Get available positions for selected parent
  const { data: positions } = useQuery<Position[]>({
    queryKey: ["/api/clients", selectedParent, "positions"],
    enabled: !!selectedParent,
  });

  // Get all clients for parent selection
  const { data: clients } = useQuery({
    queryKey: ["/api/clients/downline"],
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: CreateClientRequest) => {
      const response = await fetch("/api/clients/downline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create client");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Client created successfully! Proceeding to payment...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      // Redirect to payment page with client data
      setLocation("/client/payment");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateClientRequest) => {
    createClientMutation.mutate(data);
  };

  // Set current user as default parent when component loads
  React.useEffect(() => {
    if (user && !selectedParent) {
      setSelectedParent((user as any).id);
      form.setValue("parentId", (user as any).id);
    }
  }, [user, selectedParent, form]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <ClientSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Client</h1>
            <p className="text-gray-600 dark:text-gray-300">Create a new client account in your downline</p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>
                Enter the details for the new client. They will be added to your downline network.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <Input placeholder="10-digit mobile number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="package"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Plan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Silver">Silver - ₹510.00 INR</SelectItem>
                            <SelectItem value="Gold">Gold - ₹1010.00 INR</SelectItem>
                            <SelectItem value="Diamond">Diamond - ₹1510.00 INR</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <Label>Parent Selection & Position</Label>
                    
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Parent Client</Label>
                      <Select 
                        value={selectedParent} 
                        onValueChange={(value) => {
                          setSelectedParent(value);
                          form.setValue("parentId", value);
                          form.setValue("position", undefined); // Reset position when parent changes
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent client" />
                        </SelectTrigger>
                        <SelectContent>
                          {user && (
                            <SelectItem value={(user as any).id}>
                              {(user as any).name || (user as any).username} (You) - {(user as any).package || "Admin"}
                            </SelectItem>
                          )}
                          {clients && Array.isArray(clients) && clients.map((client: any) => {
                            return (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name || client.username} - {client.package}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedParent && positions && (
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose position" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {positions.map((pos) => (
                                  <SelectItem 
                                    key={pos.position} 
                                    value={pos.position}
                                    disabled={!pos.available}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="capitalize">{pos.position}</span>
                                      <Badge variant={pos.available ? "default" : "secondary"}>
                                        {pos.available ? "Available" : "Occupied"}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/client")}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createClientMutation.isPending}
                    >
                      {createClientMutation.isPending ? "Creating..." : "Create Client"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}