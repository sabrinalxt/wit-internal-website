import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProposalsPage from "./pages/ProposalsPage";
import CalendarPage from "./pages/CalendarPage";
import HomePage from "./pages/HomePage";
import ReviewPage from "./pages/ReviewPage";
import TemplatesPage from "./pages/TemplatesPage";
import AdminMembersPage from "./pages/AdminMembersPage";
import AdminRolesPage from "./pages/AdminRolesPage";
import ProtectedRoute, { GuestRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { PAGE_ROLES } from "./auth/access";
import "./index.css";

// Wraps a page so only signed-in users with the right roles (from PAGE_ROLES) can open it
function guard(path: string, page: React.ReactNode) {
  return <ProtectedRoute roles={PAGE_ROLES[path]}>{page}</ProtectedRoute>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Public pages
      {
        path: "login",
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: "signup",
        element: (
          <GuestRoute>
            <SignupPage />
          </GuestRoute>
        ),
      },

      // Signed-in pages
      { index: true, element: <HomePage /> },
      { path: "proposals", element: guard("/proposals", <ProposalsPage />) },
      { path: "review", element: guard("/review", <ReviewPage />) },
      { path: "calendar", element: guard("/calendar", <CalendarPage />) },
      { path: "templates", element: guard("/templates", <TemplatesPage />) },
      { path: "admin/members", element: guard("/admin/members", <AdminMembersPage />) },
      { path: "admin/roles", element: guard("/admin/roles", <AdminRolesPage />) },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);