import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ClientSidebar } from "@/components/client-sidebar";
import { FileText, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { createReportSchema, type CreateReportRequest } from "@shared/schema";

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  adminResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ClientReports() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateReportRequest>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "technical",
      priority: "medium",
    },
  });

  // Get user's reports
  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: CreateReportRequest) => {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create report");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      form.reset();
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create report",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateReportRequest) => {
    createReportMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock },
      "in-progress": { variant: "default" as const, icon: Clock },
      resolved: { variant: "default" as const, icon: CheckCircle },
      closed: { variant: "outline" as const, icon: XCircle },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "outline",
      medium: "secondary", 
      high: "default",
      urgent: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[priority as keyof typeof variants] || "secondary"}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      technical: "Technical",
      payment: "Payment",
      account: "Account",
      other: "Other"
    };
    return labels[category as keyof typeof labels] || category;
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <ClientSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
              <p className="text-gray-600 dark:text-gray-300">Submit and track your support requests</p>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </div>

          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Report</CardTitle>
                <CardDescription>
                  Submit a new support request or report an issue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description of the issue" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide detailed information about the issue"
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="payment">Payment</SelectItem>
                                <SelectItem value="account">Account</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={createReportMutation.isPending}
                      >
                        {createReportMutation.isPending ? "Submitting..." : "Submit Report"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Reports List */}
          <div className="space-y-4">
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
            ) : reports && reports.length > 0 ? (
              reports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{report.title}</h3>
                          <p className="text-muted-foreground text-sm">
                            {getCategoryLabel(report.category)} • {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(report.status)}
                          {getPriorityBadge(report.priority)}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Description:</h4>
                        <p className="text-muted-foreground">{report.description}</p>
                      </div>
                      
                      {report.adminResponse && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <h4 className="font-medium mb-1">Admin Response:</h4>
                          <p className="text-muted-foreground">{report.adminResponse}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Updated: {new Date(report.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reports submitted</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted any support requests yet
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Your First Report
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