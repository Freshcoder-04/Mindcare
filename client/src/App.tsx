import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "./hooks/use-auth";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import SelfAssessment from "@/pages/self-assessment";
import Resources from "@/pages/resources";
import Chat from "@/pages/chat";
import Appointments from "@/pages/appointments";
import NotFound from "@/pages/not-found";

// Counselor Pages
import CounselorDashboard from "@/pages/counselor/dashboard";
import CounselorAssessments from "@/pages/counselor/assessments";
import CounselorResources from "@/pages/counselor/resources";


import RegisterForm from "@/components/auth/register-form";

function ProtectedRoute({ component: Component, counselorOnly = false, ...rest }: any) {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (counselorOnly && user?.role !== "counselor") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, counselorOnly, navigate]);

  if (!isAuthenticated) return null;
  if (counselorOnly && user?.role !== "counselor") return null;

  return <Component {...rest} />;
}

function Router() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to appropriate dashboard based on role
      if (user?.role === "counselor") {
        navigate("/counselor/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      {/* Registration Route */}
      <Route path="/register" component={RegisterForm} />
      {/* Student Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/self-assessment">
        <ProtectedRoute component={SelfAssessment} />
      </Route>
      <Route path="/resources">
        <ProtectedRoute component={Resources} />
      </Route>
      <Route path="/chat">
        <ProtectedRoute component={Chat} />
      </Route>
      <Route path="/appointments">
        <ProtectedRoute component={Appointments} />
      </Route>

      {/* Counselor Routes */}
      <Route path="/counselor/dashboard">
        <ProtectedRoute component={CounselorDashboard} counselorOnly />
      </Route>
      <Route path="/counselor/assessments">
        <ProtectedRoute component={CounselorAssessments} counselorOnly />
      </Route>
      <Route path="/counselor/resources">
        <ProtectedRoute component={CounselorResources} counselorOnly />
      </Route>

      {/* Redirect / to appropriate location */}
      <Route path="/">
        {isAuthenticated ? (
          user?.role === "counselor" ? (
            <ProtectedRoute component={CounselorDashboard} counselorOnly />
          ) : (
            <ProtectedRoute component={Dashboard} />
          )
        ) : (
          <Login />
        )}
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
