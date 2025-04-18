import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/page-layout";
import ResourceForm from "@/components/counselor/resource-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Resource } from "@shared/schema";

export default function CounselorResources() {
  const { toast } = useToast();

  // ---------------------------------
  // 1. Initialize selectedCategory and selectedType to "all" instead of "".
  // ---------------------------------
  const [activeTab, setActiveTab] = useState("manage");
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Fetch all resources
  const { data: resources, isLoading } = useQuery({
    queryKey: ["/api/resources"],
    queryFn: async () => {
      const res = await fetch("/api/resources", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch resources");
      return res.json();
    },
  });

  // Extract unique categories from resources
  const categories =
    resources?.reduce((acc: string[], resource: Resource) => {
      if (!acc.includes(resource.category)) {
        acc.push(resource.category);
      }
      return acc;
    }, []) || [];

  // ---------------------------------
  // 2. Filter logic: use "all" as "no filter"
  // ---------------------------------
  const filteredResources = resources?.filter((resource: Resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || resource.category === selectedCategory;

    const matchesType = selectedType === "all" || resource.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setShowResourceForm(true);
  };

  const handleDeleteResource = (resource: Resource) => {
    setDeletingResource(resource);
  };

  const confirmDeleteResource = async () => {
    if (!deletingResource) return;

    setIsDeleting(true);

    try {
      await apiRequest("DELETE", `/api/resources/${deletingResource.id}`);

      toast({
        title: "Resource Deleted",
        description: "Resource has been deleted successfully.",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete the resource. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletingResource(null);
    }
  };

  const handleFormComplete = () => {
    setShowResourceForm(false);
    setEditingResource(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedType("all");
  };

  return (
    <PageLayout
      title="Resource Management"
      description="Create, edit, and manage resources for students"
    >
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="manage">Manage Resources</TabsTrigger>
              <TabsTrigger value="analytics">Resource Analytics</TabsTrigger>
            </TabsList>

            {activeTab === "manage" && !showResourceForm && (
              <Button onClick={() => setShowResourceForm(true)}>
                <i className="ri-add-line mr-2" />
                Create Resource
              </Button>
            )}
          </div>

          <TabsContent value="manage">
            {showResourceForm ? (
              <ResourceForm
                resourceToEdit={editingResource || undefined}
                onComplete={handleFormComplete}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Resource Library</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Search and Filter */}
                  <div className="bg-white p-4 rounded-lg mb-6 border border-neutral-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <Input
                          placeholder="Search resources..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-10"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
                          <i className="ri-search-line" />
                        </div>
                      </div>

                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* 3. Non-empty value for "All Categories" */}
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category: string) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* 4. Non-empty value for "All Types" */}
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="article">Articles</SelectItem>
                          <SelectItem value="video">Videos</SelectItem>
                          <SelectItem value="external_link">External Links</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(searchQuery || selectedCategory !== "all" || selectedType !== "all") && (
                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          <i className="ri-filter-off-line mr-2" />
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : filteredResources?.length > 0 ? (
                    <div className="space-y-4">
                      {filteredResources.map((resource: Resource) => (
                        <div
                          key={resource.id}
                          className="border border-neutral-200 rounded-lg p-4 hover:border-primary transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center mb-2">
                                <span className="text-xs bg-primary text-white rounded-full px-2 py-1 mr-2">
                                  {resource.category}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  Type: {resource.type.replace("_", " ").toUpperCase()}
                                </span>
                                <span className="text-xs text-neutral-500 ml-4">
                                  Created:{" "}
                                  {resource.createdAt
                                    ? new Date(resource.createdAt).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>

                              <div className="font-medium mb-2">{resource.title}</div>
                              <p className="text-sm text-neutral-600 mb-3">
                                {resource.description}
                              </p>

                              {resource.type === "video" || resource.type === "external_link" ? (
                                <div className="text-sm text-blue-600 truncate">
                                  <i className="ri-link mr-1" />
                                  {resource.url}
                                </div>
                              ) : (
                                <div className="text-sm text-neutral-500">
                                  <i className="ri-file-text-line mr-1" />
                                  Article content available
                                </div>
                              )}
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditResource(resource)}
                              >
                                <i className="ri-pencil-line mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteResource(resource)}
                              >
                                <i className="ri-delete-bin-line mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-book-open-line text-2xl text-neutral-400" />
                      </div>
                      <h3 className="text-lg font-medium text-neutral-700 mb-2">
                        {searchQuery || selectedCategory !== "all" || selectedType !== "all"
                          ? "No Resources Match Your Filters"
                          : "No Resources Created"}
                      </h3>
                      <p className="text-neutral-500 text-sm mb-4">
                        {searchQuery || selectedCategory !== "all" || selectedType !== "all"
                          ? "Try adjusting your search or filter criteria."
                          : "Create resources for students to access."}
                      </p>

                      {searchQuery || selectedCategory !== "all" || selectedType !== "all" ? (
                        <Button variant="outline" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      ) : (
                        <Button onClick={() => setShowResourceForm(true)}>
                          Create First Resource
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Resource Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-bar-chart-line text-2xl text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-700 mb-2">
                    Analytics Coming Soon
                  </h3>
                  <p className="text-neutral-500 text-sm mb-4">
                    Resource usage analytics will be available in a future update.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deletingResource}
          onOpenChange={(open) => !open && setDeletingResource(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Resource</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this resource? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {deletingResource && (
              <div className="bg-neutral-50 p-4 rounded-lg my-4">
                <p className="font-medium">{deletingResource.title}</p>
                <p className="text-sm text-neutral-500 mt-2">
                  Category: {deletingResource.category} | Type: {deletingResource.type}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeletingResource(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteResource}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete Resource"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
