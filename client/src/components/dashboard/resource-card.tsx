import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Resource } from "@shared/schema";

interface ResourceCardProps {
  resource: Resource;
  isSaved?: boolean;
}

export default function ResourceCard({ resource, isSaved = false }: ResourceCardProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  
  const handleToggleSave = async () => {
    try {
      if (saved) {
        await apiRequest("DELETE", `/api/resources/${resource.id}/save`);
        setSaved(false);
        toast({
          title: "Resource Unsaved",
          description: "The resource has been removed from your saved items.",
        });
      } else {
        await apiRequest("POST", `/api/resources/${resource.id}/save`);
        setSaved(true);
        toast({
          title: "Resource Saved",
          description: "The resource has been added to your saved items.",
        });
      }
      
      // Invalidate saved resources query
      queryClient.invalidateQueries({ queryKey: ['/api/resources/saved'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update saved status.",
        variant: "destructive",
      });
    }
  };
  
  // Get placeholder image based on resource type
  const getPlaceholderImage = () => {
    switch (resource.type) {
      case "video":
        return "https://images.unsplash.com/photo-1536746803623-cef87080bfc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
      case "article":
        return "https://images.unsplash.com/photo-1542596594-649edbc13630?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
      case "external_link":
        return "https://images.unsplash.com/photo-1564121211835-e88c852648ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
      default:
        return "https://images.unsplash.com/photo-1542596594-649edbc13630?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
    }
  };
  
  return (
    <>
      <Card className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {resource.type === "video" ? (
          <div className="relative">
            <img src={getPlaceholderImage()} alt={resource.title} className="w-full h-40 object-cover filter brightness-75" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                <i className="ri-play-fill text-2xl text-primary"></i>
              </div>
            </div>
          </div>
        ) : (
          <img src={getPlaceholderImage()} alt={resource.title} className="w-full h-40 object-cover" />
        )}
        
        <CardContent className="p-4">
          <div className="flex items-center mb-2">
            <span className="text-xs font-medium text-neutral-50 bg-primary rounded-full py-1 px-2">{resource.category}</span>
            <span className="ml-2 text-xs text-neutral-500">Posted by Counselor</span>
          </div>
          
          <h4 className="font-heading font-semibold text-neutral-800 mb-2">{resource.title}</h4>
          <p className="text-sm text-neutral-600 mb-3">{resource.description}</p>
          
          <div className="flex items-center justify-between">
            <Button
              variant="link"
              className="text-primary text-sm font-medium p-0 h-auto"
              onClick={() => setIsDialogOpen(true)}
            >
              {resource.type === "video" ? "Watch Video" : "Read More"}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className={saved ? "text-accent" : "text-neutral-400 hover:text-accent"}
              onClick={handleToggleSave}
            >
              <i className={saved ? "ri-star-fill" : "ri-star-line"}></i>
              <span className="sr-only">{saved ? "Unsave" : "Save"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{resource.title}</DialogTitle>
            <DialogDescription className="text-neutral-500">
              Category: {resource.category} | Type: {resource.type}
            </DialogDescription>
          </DialogHeader>
          
          {resource.type === "video" && resource.url && (
            <div className="aspect-video rounded-md overflow-hidden">
              <iframe
                src={resource.url}
                title={resource.title}
                className="w-full h-full"
                allowFullScreen
              ></iframe>
            </div>
          )}
          
          {resource.type === "article" && (
            <div className="prose max-w-none">
              {resource.content && <div dangerouslySetInnerHTML={{ __html: resource.content }} />}
              {!resource.content && <p>{resource.description}</p>}
            </div>
          )}
          
          {resource.type === "external_link" && resource.url && (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="mb-4 text-center">{resource.description}</p>
              <Button
                asChild
                className="bg-primary text-white hover:bg-primary-dark"
              >
                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                  Visit External Resource <i className="ri-external-link-line ml-2"></i>
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
