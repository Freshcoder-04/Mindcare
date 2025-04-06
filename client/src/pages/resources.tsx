import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/page-layout";
import ResourceCard from "@/components/dashboard/resource-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch all resources
  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ['/api/resources', selectedCategory],
    queryFn: async ({ queryKey }) => {
      const category = queryKey[1] as string;
      const url = category
        ? `/api/resources?category=${encodeURIComponent(category)}`
        : '/api/resources';
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch resources");
      return res.json();
    },
  });
  
  // Fetch saved resources
  const { data: savedResources, isLoading: loadingSaved } = useQuery({
    queryKey: ['/api/resources/saved'],
    queryFn: async () => {
      const res = await fetch('/api/resources/saved', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch saved resources");
      return res.json();
    },
  });
  
  // Extract unique categories from resources
  const categories = resources?.reduce((acc: string[], resource: any) => {
    if (!acc.includes(resource.category)) {
      acc.push(resource.category);
    }
    return acc;
  }, []) || [];
  
  // Filter resources based on search query
  const filteredResources = resources?.filter((resource: any) => {
    return (
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Get saved resource IDs for checking if a resource is saved
  const savedResourceIds = savedResources?.map((resource: any) => resource.id) || [];
  
  return (
    <PageLayout
      title="Resource Library"
      description="Browse articles, videos, and tips for mental well-being"
    >
      <div className="max-w-7xl mx-auto">
        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg mb-6 border border-neutral-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
                <i className="ri-search-line"></i>
              </div>
            </div>
            
            <div className="w-full md:w-64">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Resource Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="saved">Saved Resources</TabsTrigger>
          </TabsList>
          
          {/* All Resources Tab */}
          <TabsContent value="all">
            {loadingResources ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-40 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-3" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredResources?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((resource: any) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    isSaved={savedResourceIds.includes(resource.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border border-neutral-200">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-book-open-line text-2xl text-neutral-400"></i>
                </div>
                <h3 className="text-lg font-medium text-neutral-700 mb-2">No Resources Found</h3>
                <p className="text-neutral-500 text-sm mb-4">
                  {searchQuery || selectedCategory
                    ? "Try adjusting your search or filter criteria."
                    : "Resources will appear here once added by counselors."}
                </p>
                {(searchQuery || selectedCategory) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Saved Resources Tab */}
          <TabsContent value="saved">
            {loadingSaved ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-40 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-3" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : savedResources?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedResources.map((resource: any) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    isSaved={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border border-neutral-200">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-star-line text-2xl text-neutral-400"></i>
                </div>
                <h3 className="text-lg font-medium text-neutral-700 mb-2">No Saved Resources</h3>
                <p className="text-neutral-500 text-sm mb-4">
                  Resources you save will appear here for easy access.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("all")}
                >
                  Browse Resources
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
