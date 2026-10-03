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
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "proposals", element: <ProposalsPage /> },
      { path: "review", element: <ReviewPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "templates", element: <TemplatesPage /> },
      { path: "admin/members", element: <AdminMembersPage /> },
      { path: "admin/roles", element: <AdminRolesPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
