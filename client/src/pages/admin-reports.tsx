import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, XCircle, MessageSquare, Filter, Archive } from "lucide-react";
import { Report } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function AdminReports() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [adminResponse, setAdminResponse] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all reports (admin endpoint)
  const { data: allReports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports"],
  });

  // Filter reports based on selected filters
  const filteredReports = allReports?.filter(report => {
    if (selectedCategory !== "all" && report.category !== selectedCategory) return false;
    if (selectedStatus !== "all" && report.status !== selectedStatus) return false;
    if (selectedPriority !== "all" && report.priority !== selectedPriority) return false;
    return true;
  }) || [];

  // Separate open and closed reports
  const openReports = filteredReports.filter(report => report.status !== "closed");
  const closedReports = filteredReports.filter(report => report.status === "closed");

  // Update report status mutation
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status, response }: { reportId: string, status: string, response?: string }) => {
      return await apiRequest('PUT', `/api/reports/${reportId}`, {
        status,
        adminResponse: response
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      setSelectedReport(null);
      setAdminResponse("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update report",
        variant: "destructive",
      });
    },
  });

  const handleCloseReport = (reportId: string, response?: string) => {
    updateReportMutation.mutate({
      reportId,
      status: "closed",
      response
    });
  };

  const handleUpdateStatus = (reportId: string, status: string) => {
    updateReportMutation.mutate({ reportId, status });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      "in-progress": { variant: "default" as const, icon: Clock, color: "text-blue-600" },
      resolved: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      closed: { variant: "outline" as const, icon: XCircle, color: "text-gray-600" },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: { variant: "outline" as const, color: "text-gray-600" },
      medium: { variant: "secondary" as const, color: "text-blue-600" },
      high: { variant: "default" as const, color: "text-orange-600" },
      urgent: { variant: "destructive" as const, color: "text-red-600" }
    };
    
    const config = variants[priority as keyof typeof variants] || variants.medium;
    
    return (
      <Badge variant={config.variant} className={config.color}>
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

  const ReportCard = ({ report }: { report: Report }) => (
    <Card key={report.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{report.title}</h3>
              <p className="text-sm text-muted-foreground">
                {getCategoryLabel(report.category)} • {new Date(report.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {getStatusBadge(report.status)}
              {getPriorityBadge(report.priority)}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Description:</h4>
            <p className="text-muted-foreground text-sm">{report.description}</p>
          </div>
          
          {report.adminResponse && (
            <div className="bg-muted/50 rounded-lg p-3">
              <h4 className="font-medium mb-1 text-sm">Admin Response:</h4>
              <p className="text-muted-foreground text-sm">{report.adminResponse}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Updated: {new Date(report.updatedAt).toLocaleString()}
              </p>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            {report.status !== "closed" && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Respond
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Respond to Report</DialogTitle>
                      <DialogDescription>
                        {report.title}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Enter your response..."
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAdminResponse("")}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleCloseReport(report.id, adminResponse)}
                        disabled={updateReportMutation.isPending}
                      >
                        {updateReportMutation.isPending ? "Sending..." : "Send & Close"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Select onValueChange={(status) => handleUpdateStatus(report.id, status)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => handleCloseReport(report.id)}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Closed
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="lg:ml-64 transition-all duration-300">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Reports Management</h1>
            <p className="text-muted-foreground">
              Manage and respond to client support requests
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedStatus("all");
                      setSelectedPriority("all");
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                <MessageSquare className="h-4 w-4 mr-2" />
                All Reports ({filteredReports.length})
              </TabsTrigger>
              <TabsTrigger value="open">
                <Clock className="h-4 w-4 mr-2" />
                Open Reports ({openReports.length})
              </TabsTrigger>
              <TabsTrigger value="closed">
                <Archive className="h-4 w-4 mr-2" />
                Closed Reports ({closedReports.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
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
              ) : filteredReports.length > 0 ? (
                <div className="space-y-4">
                  {filteredReports.map(report => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                    <p className="text-muted-foreground">
                      No reports match your current filters
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="open" className="space-y-4 mt-6">
              {openReports.length > 0 ? (
                <div className="space-y-4">
                  {openReports.map(report => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">
                      No open reports at the moment
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="closed" className="space-y-4 mt-6">
              {closedReports.length > 0 ? (
                <div className="space-y-4">
                  {closedReports.map(report => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No closed reports</h3>
                    <p className="text-muted-foreground">
                      Closed reports will appear here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}