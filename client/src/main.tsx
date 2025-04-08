import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "@/contexts/auth-context";
import { UserRoleProvider } from "@/contexts/user-role-context";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <UserRoleProvider>
      <App />
    </UserRoleProvider>
  </AuthProvider>
);
