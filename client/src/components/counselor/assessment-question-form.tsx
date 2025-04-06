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
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AssessmentQuestion } from "@shared/schema";

// Form schema with validation
const formSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  options: z.string().min(5, "Options must be at least 5 characters"),
  category: z.string().min(3, "Category is required"),
  weight: z.string().transform((val) => parseInt(val)),
});

interface AssessmentQuestionFormProps {
  questionToEdit?: AssessmentQuestion;
  onComplete: () => void;
}

export default function AssessmentQuestionForm({
  questionToEdit,
  onComplete,
}: AssessmentQuestionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!questionToEdit;
  
  // Parse options array to string for form
  const parseOptionsToString = (options: string[]) => {
    return options.join("\n");
  };
  
  // Parse options string to array for submission
  const parseOptionsToArray = (optionsString: string) => {
    return optionsString
      .split("\n")
      .map((option) => option.trim())
      .filter((option) => option.length > 0);
  };
  
  // Set up form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: questionToEdit?.question || "",
      options: questionToEdit ? parseOptionsToString(questionToEdit.options) : "",
      category: questionToEdit?.category || "",
      weight: questionToEdit?.weight.toString() || "1",
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Validate that we have at least 2 options
    const options = parseOptionsToArray(values.options);
    if (options.length < 2) {
      toast({
        title: "Invalid Options",
        description: "Please provide at least 2 options for the question.",
        variant: "destructive",
      });
      return;
    }
    
    const questionData = {
      question: values.question,
      options: options,
      category: values.category,
      weight: parseInt(values.weight.toString()),
    };
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && questionToEdit) {
        // Update existing question
        await apiRequest("PUT", `/api/assessment/questions/${questionToEdit.id}`, questionData);
        toast({
          title: "Question Updated",
          description: "Assessment question has been updated successfully.",
        });
      } else {
        // Create new question
        await apiRequest("POST", "/api/assessment/questions", questionData);
        toast({
          title: "Question Created",
          description: "New assessment question has been created successfully.",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/assessment/questions'] });
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: isEditing
          ? "Failed to update the assessment question. Please try again."
          : "Failed to create the assessment question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Assessment Question" : "Create New Assessment Question"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the question text"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="options"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Options</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter each option on a new line"
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter each option on a new line. Options should be listed from lowest to highest severity.
                  </FormDescription>
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
                    <FormControl>
                      <Input placeholder="e.g., Anxiety, Stress, Mood" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border border-neutral-200 rounded-md"
                        {...field}
                      >
                        <option value="1">1 - Low Importance</option>
                        <option value="2">2 - Medium Importance</option>
                        <option value="3">3 - High Importance</option>
                      </select>
                    </FormControl>
                    <FormDescription>
                      Higher weight questions have more impact on the assessment score.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                isEditing ? "Update Question" : "Create Question"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
