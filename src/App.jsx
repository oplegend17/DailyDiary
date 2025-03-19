import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import SupabaseConnectionError from './components/SupabaseConnectionError';
import './App.css';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const CreateNote = lazy(() => import('./pages/CreateNote'));
const EditNote = lazy(() => import('./pages/EditNote'));
const NoteDetail = lazy(() => import('./pages/NoteDetail'));
const NotesList = lazy(() => import('./pages/NotesList'));
const Settings = lazy(() => import('./pages/Settings'));
const Calendar = lazy(() => import('./pages/Calendar'));

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, supabaseError } = useAuth();
  
  if (supabaseError) {
    return <SupabaseConnectionError />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Public Route component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { user, supabaseError } = useAuth();
  
  if (supabaseError) {
    return <SupabaseConnectionError />;
  }
  
  if (user) {
    return <Navigate to="/" />;
  }
  return children;
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

// Separate component to use the useAuth hook which must be used within AuthProvider
function AppContent() {
  const { supabaseError, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }
  
  if (supabaseError) {
    return <SupabaseConnectionError />;
  }
  
  return (
    <Layout>
      <Suspense fallback={
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      }>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          } />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/notes" element={
            <ProtectedRoute>
              <NotesList />
            </ProtectedRoute>
          } />
          <Route path="/notes/new" element={
            <ProtectedRoute>
              <CreateNote />
            </ProtectedRoute>
          } />
          <Route path="/notes/:id/edit" element={
            <ProtectedRoute>
              <EditNote />
            </ProtectedRoute>
          } />
          <Route path="/notes/:id" element={
            <ProtectedRoute>
              <NoteDetail />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          } />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
