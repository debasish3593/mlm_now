import { useState, useEffect } from "react";
import React from "react";
import { UserWithoutPassword } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageBadge } from "@/components/package-badge";
import { 
  ChevronDown, 
  ChevronUp, 
  User as UserIcon, 
  UserX, 
  Crown,
  Trash2
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TreeNode {
  user: UserWithoutPassword | null; // null represents empty slot
  leftChild: TreeNode | null;
  rightChild: TreeNode | null;
  isExpanded: boolean;
  level: number;
}

interface HierarchicalTreeProps {
  users: UserWithoutPassword[];
  currentUser: UserWithoutPassword;
  isAdmin: boolean;
  onDeleteClient?: (clientId: string) => void;
}

export function HierarchicalTree({ users, currentUser, isAdmin, onDeleteClient }: HierarchicalTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build hierarchical tree structure
  const buildHierarchicalTree = (rootUserId: string | null, allUsers: UserWithoutPassword[], level: number = 0): TreeNode | null => {
    const user = rootUserId ? allUsers.find(u => u.id === rootUserId) || null : null;
    
    if (!user && rootUserId) return null;

    const children = allUsers.filter(u => u.parentId === rootUserId);
    const leftChild = children.find(u => u.position === 'left');
    const rightChild = children.find(u => u.position === 'right');



    return {
      user,
      leftChild: leftChild ? buildHierarchicalTree(leftChild.id, allUsers, level + 1) : null,
      rightChild: rightChild ? buildHierarchicalTree(rightChild.id, allUsers, level + 1) : null,
      isExpanded: user ? expandedNodes.has(user.id) : false,
      level
    };
  };

  // Get root user for tree
  const getRootUser = (): string | null => {
    if (isAdmin) {
      // For admin, start from the first user without parent (or admin itself)
      const rootUser = users.find(u => !u.parentId) || currentUser;
      return rootUser.id;
    } else {
      // For client, start from themselves
      return currentUser.id;
    }
  };

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete client');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Client deleted",
        description: "Client has been successfully removed from the system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (window.confirm(`Are you sure you want to delete client "${clientName}"? This action cannot be undone.`)) {
      deleteClientMutation.mutate(clientId);
    }
  };

  // Render empty slot placeholder
  const EmptySlot = ({ position, level }: { position: 'left' | 'right'; level: number }) => (
    <div 
      className="flex flex-col items-center"
      data-testid={`empty-slot-${position}-level-${level}`}
    >
      <div className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center">
        <UserX className="h-6 w-6 text-white" />
      </div>
      <div className="mt-2 text-xs text-gray-600 font-medium">
        No User
      </div>
    </div>
  );

  // Render user node
  const UserNode = ({ node }: { node: TreeNode }) => {
    if (!node.user) return null;

    const user = node.user;
    const hasChildren = node.leftChild || node.rightChild;
    const isExpanded = expandedNodes.has(user.id);

    return (
      <div 
        className="flex flex-col items-center"
        data-testid={`user-node-${user.id}`}
      >
        {/* User Avatar Circle */}
        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mb-2 relative">
          <UserIcon className="h-8 w-8 text-white" />
          {user.role === 'admin' && (
            <Crown className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1" />
          )}
          
          {/* Delete Button for Admin */}
          {isAdmin && user.role === 'client' && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-1 -right-1 h-6 w-6 p-0 bg-red-100 hover:bg-red-200 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClient(user.id, user.name || user.username);
              }}
              data-testid={`button-delete-${user.id}`}
            >
              <Trash2 className="h-3 w-3 text-red-600" />
            </Button>
          )}
        </div>

        {/* User Name */}
        <div className="text-sm font-medium text-center mb-1">
          {user.name || user.username}
        </div>
        
        {/* Package Badge */}
        {user.package && (
          <div className="mb-1">
            <PackageBadge package={user.package} size="sm" />
          </div>
        )}

        {/* Username */}
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          @{user.username}
        </div>

        {/* Expand/Collapse Button */}
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => toggleExpanded(user.id)}
            data-testid={`toggle-expand-${user.id}`}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    );
  };

  // Render complete binary tree with proper connecting lines like reference
  const renderBinaryTreeLevel = (level: number, nodes: (TreeNode | null)[]): JSX.Element => {
    if (level >= 3) return <></>;
    
    const nextLevelNodes: (TreeNode | null)[] = [];
    
    // Prepare next level nodes
    nodes.forEach(node => {
      nextLevelNodes.push(node?.leftChild || null);
      nextLevelNodes.push(node?.rightChild || null);
    });
    
    const hasNextLevel = nextLevelNodes.some(n => n !== null) && level < 2;
    
    return (
      <div className="flex flex-col items-center w-full">
        {/* Current Level Nodes */}
        <div className={`flex justify-center items-center ${level === 0 ? '' : level === 1 ? 'space-x-32' : 'space-x-16'}`}>
          {nodes.map((node, index) => (
            <div key={`level-${level}-node-${index}`} className="flex flex-col items-center relative">
              {node?.user ? <UserNode node={node} /> : <EmptySlot position={index % 2 === 0 ? "left" : "right"} level={level} />}
            </div>
          ))}
        </div>

        {/* Connection Lines */}
        {hasNextLevel && (
          <div className="relative w-full flex justify-center" style={{ height: '60px' }}>
            {nodes.map((node, index) => {
              if (!node?.user || (!node.leftChild && !node.rightChild)) return null;
              
              const hasLeft = node.leftChild?.user;
              const hasRight = node.rightChild?.user;
              
              return (
                <div key={`connections-${level}-${index}`} className="absolute" style={{ 
                  left: level === 0 ? '50%' : level === 1 ? `${25 + (index * 50)}%` : `${12.5 + (index * 25)}%`,
                  transform: 'translateX(-50%)'
                }}>
                  {/* Vertical line down from parent */}
                  <div className="w-0.5 h-6 bg-gray-400 mx-auto"></div>
                  
                  {(hasLeft || hasRight) && (
                    <>
                      {/* Horizontal line */}
                      <div className={`h-0.5 bg-gray-400 ${level === 0 ? 'w-64' : level === 1 ? 'w-32' : 'w-16'}`} 
                           style={{ marginLeft: level === 0 ? '-128px' : level === 1 ? '-64px' : '-32px', marginTop: '6px' }}></div>
                      
                      {/* Vertical lines to children */}
                      {hasLeft && (
                        <div className={`w-0.5 h-6 bg-gray-400 absolute top-6 ${level === 0 ? '-left-32' : level === 1 ? '-left-16' : '-left-8'}`}></div>
                      )}
                      {hasRight && (
                        <div className={`w-0.5 h-6 bg-gray-400 absolute top-6 ${level === 0 ? '-right-32' : level === 1 ? '-right-16' : '-right-8'}`}></div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Render next level if any nodes exist */}
        {hasNextLevel && (
          <div style={{ marginTop: '20px' }}>
            {renderBinaryTreeLevel(level + 1, nextLevelNodes)}
          </div>
        )}
      </div>
    );
  };

  const rootUserId = getRootUser();
  const tree = rootUserId ? buildHierarchicalTree(rootUserId, users) : null;

  // Auto-expand the root node by default
  React.useEffect(() => {
    if (tree?.user && !expandedNodes.has(tree.user.id)) {
      setExpandedNodes(prev => new Set(Array.from(prev).concat([tree.user!.id])));
    }
  }, [tree?.user?.id]);

  return (
    <div className="w-full overflow-auto p-8" data-testid="hierarchical-tree">
      <div className="min-w-fit flex justify-center">
        {tree ? renderBinaryTreeLevel(0, [tree]) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <UserX className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No clients in the system yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}