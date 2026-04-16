import React, { useEffect } from 'react'

export default function About() {
  useEffect(() => {
    // Redirect to our story page
    window.location.replace('/our-story');
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground mb-4">Redirecting...</h1>
        <p className="text-muted-foreground">Taking you to our story page.</p>
      </div>
    </div>
  );
}