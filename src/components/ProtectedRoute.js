import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute ensures only authenticated users can access protected pages.
 * If user is not logged in → redirects to "/".
 */
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // if user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ✅ must return children, or nothing will render
  return children;
};

export default ProtectedRoute;
