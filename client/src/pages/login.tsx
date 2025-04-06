import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";

export default function Login() {
  const [activeTab, setActiveTab] = useState("login");
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center text-white mx-auto mb-4">
              <i className="ri-mental-health-line text-2xl"></i>
            </div>
            <h2 className="text-2xl font-heading font-bold text-neutral-800">Welcome to MindCare</h2>
            <p className="text-neutral-600 mt-2">Your anonymous mental health companion</p>
          </div>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Create Account</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-500">
              By continuing, you agree to MindCare's 
              <a href="#" className="text-primary hover:underline ml-1">Terms of Service</a> and 
              <a href="#" className="text-primary hover:underline ml-1">Privacy Policy</a>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
