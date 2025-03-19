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
    return <Navigate to="/dashboard" />;
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
  const { supabaseError, loading, user } = useAuth();
  
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
  
  // Determine if we need to render the layout (only for authenticated users)
  const renderWithLayout = (element) => {
    return user ? <Layout>{element}</Layout> : element;
  };
  
  return (
    <Suspense fallback={
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    }>
      <Routes>
        {/* Root route redirects to login by default or dashboard if authenticated */}
        <Route path="/" element={
          user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } />

        {/* Public routes without Layout */}
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

        {/* Protected routes with Layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            {renderWithLayout(<Dashboard />)}
          </ProtectedRoute>
        } />
        <Route path="/notes" element={
          <ProtectedRoute>
            {renderWithLayout(<NotesList />)}
          </ProtectedRoute>
        } />
        <Route path="/notes/new" element={
          <ProtectedRoute>
            {renderWithLayout(<CreateNote />)}
          </ProtectedRoute>
        } />
        <Route path="/notes/:id/edit" element={
          <ProtectedRoute>
            {renderWithLayout(<EditNote />)}
          </ProtectedRoute>
        } />
        <Route path="/notes/:id" element={
          <ProtectedRoute>
            {renderWithLayout(<NoteDetail />)}
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            {renderWithLayout(<Settings />)}
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            {renderWithLayout(<Calendar />)}
          </ProtectedRoute>
        } />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App;
