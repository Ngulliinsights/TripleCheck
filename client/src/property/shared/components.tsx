import React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "../../local/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../local/components/ui/card"
import PropertyDetailsSkeleton from "../../local/components/skeletons/PropertyDetailsSkeleton"

interface StateProps {
  title?: string
  message?: string
  onBack?: () => void
  onRetry?: () => void
}

export function PropertyLoadingState({ message = "Loading details..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-8">
      <div className="flex items-center space-x-2 text-muted-foreground mb-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>{message}</span>
      </div>
      <div className="container mx-auto px-4 w-full">
         <PropertyDetailsSkeleton />
      </div>
    </div>
  )
}

export function PropertyErrorState({
  title = "Property Not Found",
  message = "The property you're looking for does not exist or has been removed.",
  onBack,
  onRetry,
}: StateProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="p-8 text-center max-w-md">
        <CardContent>
          <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
          <p className="text-muted-foreground mb-4">{message}</p>
          <div className="flex gap-2 justify-center">
            {onBack && (
              <Button onClick={onBack} variant="outline">
                Go Back
              </Button>
            )}
            {onRetry && (
              <Button onClick={onRetry}>
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
