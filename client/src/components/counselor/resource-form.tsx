import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Resource } from "@shared/schema";

// Form schema with validation
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["article", "video", "external_link"], {
    required_error: "Please select a resource type",
  }),
  content: z.string().optional(),
  url: z.string().url("Please enter a valid URL").optional(),
  category: z.string().min(3, "Category is required"),
});

interface ResourceFormProps {
  resourceToEdit?: Resource;
  onComplete: () => void;
}

export default function ResourceForm({
  resourceToEdit,
  onComplete,
}: ResourceFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!resourceToEdit;
  
  // Set up form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: resourceToEdit?.title || "",
      description: resourceToEdit?.description || "",
      type: resourceToEdit?.type || "article",
      content: resourceToEdit?.content || "",
      url: resourceToEdit?.url || "",
      category: resourceToEdit?.category || "",
    },
  });
  
  // Watch the type field to conditionally show fields
  const resourceType = form.watch("type");
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Validate based on resource type
    if (values.type === "article" && !values.content) {
      toast({
        title: "Missing Content",
        description: "Article type resources must have content.",
        variant: "destructive",
      });
      return;
    }
    
    if ((values.type === "video" || values.type === "external_link") && !values.url) {
      toast({
        title: "Missing URL",
        description: `${values.type === "video" ? "Video" : "External link"} type resources must have a URL.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && resourceToEdit) {
        // Update existing resource
        await apiRequest("PUT", `/api/resources/${resourceToEdit.id}`, values);
        toast({
          title: "Resource Updated",
          description: "Resource has been updated successfully.",
        });
      } else {
        // Create new resource
        await apiRequest("POST", "/api/resources", values);
        toast({
          title: "Resource Created",
          description: "New resource has been created successfully.",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: isEditing
          ? "Failed to update the resource. Please try again."
          : "Failed to create the resource. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Resource" : "Create New Resource"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the resource title" {...field} />
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
                      placeholder="Describe the resource briefly"
                      className="resize-none"
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a resource type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="external_link">External Link</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Anxiety, Stress Management" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {(resourceType === "video" || resourceType === "external_link") && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>
                      {resourceType === "video"
                        ? "Enter the video URL (YouTube, Vimeo, etc.)"
                        : "Enter the external resource URL"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {resourceType === "article" && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write the article content here..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      You can use markdown or HTML for formatting.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onComplete}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Resource" : "Create Resource"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
