import * as React from "react"

// Placeholder dialog components - will be replaced with full Radix implementation later
export const Dialog = ({ children, open, onOpenChange }: { 
  children: React.ReactNode; 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void; 
}) => {
  return <div>{children}</div>
}

export const DialogTrigger = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>
}

export const DialogContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
      {children}
    </div>
  </div>
}

export const DialogHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="mb-4">{children}</div>
}

export const DialogTitle = ({ children }: { children: React.ReactNode }) => {
  return <h2 className="text-lg font-semibold">{children}</h2>
}