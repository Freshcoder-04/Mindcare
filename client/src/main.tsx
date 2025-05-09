import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "@/contexts/auth-context";
import { UserRoleProvider } from "@/contexts/user-role-context";
import { BrowserRouter } from "react-router-dom"

createRoot(document.getElementById("root")!).render(
  <BrowserRouter> 
  <AuthProvider>
    <App />
  </AuthProvider>
  </BrowserRouter> 
);
