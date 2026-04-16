import { useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'

/**
 * LandRedirect Component
 * 
 * Redirects legacy /land/:id routes to the unified /property/:id pattern
 * Maintains deep-link compatibility while standardizing routes
 */
export default function LandRedirect() {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    // Log the redirect for analytics/debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`Redirecting /land/${id} to /property/${id}`);
    }
  }, [id]);

  // Redirect to unified property route
  if (!id) {
    return <Navigate to="/properties" replace />;
  }

  return <Navigate to={`/property/${id}`} replace />;
}