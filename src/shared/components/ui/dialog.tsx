import * as React from 'react'

// Placeholder dialog components - will be replaced with full Radix implementation later
export const Dialog = ({ children, open, onOpenChange }: { 
  children: React.ReactNode; 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void; 
}) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export const DialogTrigger = ({ children, asChild }: { 
  children: React.ReactNode; 
  asChild?: boolean; 
}) => {
  if (asChild) {
    // When asChild is true, render children directly (they should handle the trigger behavior)
    return <>{children}</>
  }
  return <div>{children}</div>
}

export const DialogContent = ({ children, className = "" }: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}>
      {children}
    </div>
  );
}

export const DialogHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="mb-4">{children}</div>
}

export const DialogTitle = ({ children, className = "" }: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>
}

export const DialogDescription = ({ children, className = "" }: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
}

export const DialogFooter = ({ children, className = "" }: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return <div className={`flex justify-end gap-2 mt-4 ${className}`}>{children}</div>
}