import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy } from "lucide-react";

const passwordSchema = z.string()
  .min(6, "Password must be at least 6 characters long")
  .regex(
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/,
    "Password must contain at least one uppercase letter, one number, and one special character"
  );

const formSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(["student", "counselor"]).default("student"),
  name: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(
  (data) => data.role === "student" || (data.role === "counselor" && data.name && data.name.trim().length > 0),
  {
    message: "Name is required for counselors.",
    path: ["name"],
  }
);

export default function RegisterForm() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState<string | null>(null);
  const [idCopied, setIdCopied] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      name: "",
    },
  });
  const selectedRole = form.watch("role");
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Now, pass the role as well:
      const username = await register(values.role, values.password);
      console.log("Generated username:", username);
      if (username) {
        setGeneratedUsername(username);
        form.reset({ password: "", confirmPassword: "", role: "student" });
        toast({
          title: "Account Created",
          description: "Your anonymous account has been created successfully. Be sure to save your ID!",
        });
      } else {
        throw new Error("No user ID returned from server");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "Failed to create your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopyUsername() {
    if (generatedUsername) {
      navigator.clipboard.writeText(generatedUsername);
      setIdCopied(true);
      toast({
        title: "ID Copied",
        description: "Your anonymous ID has been copied to clipboard.",
      });
    }
  }

  function handleContinue() {
    if (idCopied) {
      navigate("/dashboard");
    } else {
      toast({
        title: "Copy Your ID First",
        description: "Please copy your ID before continuing. You'll need it to log in later.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      {generatedUsername ? (
        <div className="space-y-6">
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <AlertDescription className="py-2">
              <span className="font-bold">Account Created Successfully!</span> 
              <br />Your anonymous ID is shown below.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col bg-primary/10 border border-primary/20 rounded-lg p-6">
            <label className="text-sm font-medium text-neutral-600 mb-2">
              Your Anonymous ID:
            </label>
            <div className="flex items-center justify-between p-3 bg-white border border-primary/30 rounded-md">
              <span className="text-xl font-mono font-semibold tracking-wider">{generatedUsername}</span>
              <Button 
                size="sm" 
                variant={idCopied ? "outline" : "default"} 
                onClick={handleCopyUsername}
                className="ml-3"
              >
                <Copy className="h-4 w-4 mr-2" />
                {idCopied ? "Copied!" : "Copy ID"}
              </Button>
            </div>
            
            <div className="mt-4 bg-amber-50 border border-amber-200 p-4 rounded-md text-amber-800 text-sm">
              <strong className="text-amber-900">⚠️ Important:</strong> Save this ID securely. You'll need it to log in.
              We cannot recover your account if you lose this ID as we don't store any personal information.
            </div>
          </div>
          
          <Button 
            onClick={handleContinue} 
            className="w-full" 
            variant={idCopied ? "default" : "outline"}
            disabled={!idCopied}
          >
            {idCopied ? "Continue to Dashboard" : "Copy ID First, Then Continue"}
          </Button>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-2">Create Anonymous Account</h2>
            <p className="text-neutral-600 text-sm">
              We will generate a random 8-digit ID for you. No personal information is required.
            </p>
          </div>
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Create a password"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Must be at least 6 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Role</FormLabel>
                <FormControl>
                  <div className="flex space-x-4">
                    <label>
                      <input
                        type="radio"
                        value="student"
                        checked={field.value === "student"}
                        onChange={field.onChange}
                      />{" "}
                      Student
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="counselor"
                        checked={field.value === "counselor"}
                        onChange={field.onChange}
                      />{" "}
                      Counselor
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {selectedRole === "counselor" && (
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Anonymous Account"}
          </Button>
          
          <div className="text-center mt-4">
            <span className="text-sm text-neutral-600">Already have an account? </span>
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm" 
              onClick={() => navigate("/login")}
              type="button"
            >
              Log in here
            </Button>
          </div>
        </form>
      )}
    </Form>
  );
}
