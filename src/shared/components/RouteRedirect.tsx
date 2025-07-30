import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface RouteRedirectProps {
  to: string;
  replace?: boolean;
}

export const RouteRedirect = ({ to, replace = true }: RouteRedirectProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, to, replace]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default RouteRedirect;