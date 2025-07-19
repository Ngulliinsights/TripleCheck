import React from "react";
import { Switch, Route } from "wouter";
import LoginPage from "./login";
import RegisterPage from "./register";

/**
 * Authentication routes module
 * Handles all auth-related routing with proper nested structure
 */
export default function AuthRoutes() {
  return (
    <Switch>
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      
      {/* Default redirect to login for /auth */}
      <Route path="/auth">
        {() => {
          // Redirect to login page
          window.location.href = "/auth/login";
          return null;
        }}
      </Route>
    </Switch>
  );
}