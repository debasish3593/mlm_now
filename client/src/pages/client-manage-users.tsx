import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientSidebar } from "@/components/client-sidebar";
import { Users, UserPlus, GitBranch, Search, Filter } from "lucide-react";
import { useState } from "react";

interface Client {
  id: string;
  name: string;
  username: string;
  email: string;
  mobile: string;
  package: string;
  position: string;
  parentId: string;
  createdAt: string;
}

export default function ClientManageUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [packageFilter, setPackageFilter] = useState<string>("all");

  // Get current user's downline
  const { data: downlineClients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients/downline"],
  });

  // Get current user info
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const filteredClients = downlineClients?.filter((client) => {
    const matchesSearch = client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPackage = packageFilter === "all" || client.package === packageFilter;
    return matchesSearch && matchesPackage;
  }) || [];

  const getPositionBadge = (position: string) => {
    return (
      <Badge variant={position === "left" ? "default" : "secondary"}>
        {position === "left" ? "Left" : "Right"}
      </Badge>
    );
  };

  const getPackageBadge = (packageName: string) => {
    const variants = {
      Silver: "default",
      Gold: "secondary", 
      Diamond: "outline"
    } as const;
    
    return (
      <Badge variant={variants[packageName as keyof typeof variants] || "default"}>
        {packageName}
      </Badge>
    );
  };

  // Simple binary tree visualization component
  const BinaryTreeView = () => {
    if (!downlineClients || downlineClients.length === 0) {
      return (
        <div className="text-center py-8">
          <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No downline members yet</p>
          <p className="text-sm text-muted-foreground">Add clients to see your binary tree structure</p>
        </div>
      );
    }

    const leftClients = downlineClients.filter(c => c.position === "left");
    const rightClients = downlineClients.filter(c => c.position === "right");

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-block p-4 border-2 border-primary rounded-lg bg-primary/5">
            <div className="font-semibold">{(user as any)?.name || (user as any)?.username}</div>
            <div className="text-sm text-muted-foreground">You</div>
            {getPackageBadge((user as any)?.package || "Admin")}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Side */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Left Position</h3>
            {leftClients.length > 0 ? (
              leftClients.map((client) => (
                <Card key={client.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{client.name}</div>
                        <div className="text-sm text-muted-foreground">@{client.username}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                      </div>
                      <div className="space-y-1">
                        {getPackageBadge(client.package)}
                        {getPositionBadge(client.position)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <UserPlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Left position available</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Side */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Right Position</h3>
            {rightClients.length > 0 ? (
              rightClients.map((client) => (
                <Card key={client.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{client.name}</div>
                        <div className="text-sm text-muted-foreground">@{client.username}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                      </div>
                      <div className="space-y-1">
                        {getPackageBadge(client.package)}
                        {getPositionBadge(client.position)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <UserPlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Right position available</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <ClientSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Users</h1>
            <p className="text-gray-600 dark:text-gray-300">View and manage your downline network</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">All Users</TabsTrigger>
              <TabsTrigger value="tree">Binary Tree</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Search Users</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="Search by name, username, or email..."
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="package">Filter by Package</Label>
                      <Select value={packageFilter} onValueChange={setPackageFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All packages" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Packages</SelectItem>
                          <SelectItem value="Silver">Silver</SelectItem>
                          <SelectItem value="Gold">Gold</SelectItem>
                          <SelectItem value="Diamond">Diamond</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Users List */}
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
                ) : filteredClients.length > 0 ? (
                  <div className="grid gap-4">
                    {filteredClients.map((client) => (
                      <Card key={client.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h3 className="font-semibold text-lg">{client.name}</h3>
                                  <p className="text-muted-foreground">@{client.username}</p>
                                </div>
                                <div className="flex gap-2">
                                  {getPackageBadge(client.package)}
                                  {getPositionBadge(client.position)}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Email:</span> {client.email}
                                </div>
                                <div>
                                  <span className="font-medium">Mobile:</span> {client.mobile}
                                </div>
                                <div>
                                  <span className="font-medium">Joined:</span> {new Date(client.createdAt).toLocaleDateString()}
                                </div>
                                <div>
                                  <span className="font-medium">Position:</span> {client.position}
                                </div>
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
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No users found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm || packageFilter !== "all" 
                          ? "Try adjusting your search or filter criteria"
                          : "You haven't added any clients to your downline yet"
                        }
                      </p>
                      {!searchTerm && packageFilter === "all" && (
                        <Button onClick={() => window.location.href = "/client/add-client"}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Your First Client
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tree" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Binary Tree Structure
                  </CardTitle>
                  <CardDescription>
                    View your network in a binary tree format showing left and right positions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BinaryTreeView />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}