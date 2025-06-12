import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { UserStateProvider } from "./contexts/UserStateContext";
import { useAuth } from "./hooks/useAuth";
import MainLayout from "./components/layout/MainLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import MyCoursesPage from "./pages/MyCoursesPage";
import FavoritesPage from "./pages/FavoritesPage";
import LessonPlansPage from "./pages/LessonPlansPage";
import ProfilePage from "./pages/ProfilePage";

import * as Sentry from "@sentry/react";
import ErrorBoundary from "./components/ErrorBoundary";

const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <UserStateProvider>
        <Router>
          <SentryRoutes>
            <Route
              path="/login"
              element={<LoginPage />}
              errorElement={<ErrorBoundary />}
            />

            <Route path="/" element={<MainLayout />}>
              <Route
                index
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="courses"
                element={
                  <ProtectedRoute>
                    <CoursesPage />
                  </ProtectedRoute>
                }
                errorElement={<ErrorBoundary />}
              />

              <Route
                path="courses/:courseId"
                element={
                  <ProtectedRoute>
                    <CourseDetailPage />
                  </ProtectedRoute>
                }
                errorElement={<ErrorBoundary />}
              />

              <Route
                path="my-courses"
                element={
                  <ProtectedRoute>
                    <MyCoursesPage />
                  </ProtectedRoute>
                }
                errorElement={<ErrorBoundary />}
              />

              <Route
                path="favorites"
                element={
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
                }
                errorElement={<ErrorBoundary />}
              />

              <Route
                path="lesson-plans"
                element={
                  <ProtectedRoute>
                    <LessonPlansPage />
                  </ProtectedRoute>
                }
                errorElement={<ErrorBoundary />}
              />

              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
                errorElement={<ErrorBoundary />}
              />
            </Route>

            <Route
              path="*"
              element={<Navigate to="/" replace />}
              errorElement={<ErrorBoundary />}
            />
          </SentryRoutes>
        </Router>
      </UserStateProvider>
    </AuthProvider>
  );
}

export default App;
