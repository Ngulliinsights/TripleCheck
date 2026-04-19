import { GalleryImage } from "../../local/components/images/gallery/types"

export function convertToGalleryImages(
  images: string[],
  title: string,
  category = "property"
): GalleryImage[] {
  return images.map((url, index) => ({
    id: `${category}-${index}`,
    src: url,
    alt: `${title} - View ${index + 1}`,
    category,
  }))
}

export function getVerificationBadgeVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  const map: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    verified: "default",
    pending: "secondary",
    unverified: "outline",
    flagged: "destructive",
    completed: "default",
    required: "secondary",
    clear: "default",
    disputed: "destructive",
    unmarked: "destructive",
    low: "default",
    medium: "secondary",
    high: "destructive",
  }
  return map[status] ?? "outline"
}
export function getTrustScoreColor(score: number): string {
  return score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"
}

export const NOT_SPECIFIED = "Not specified"
