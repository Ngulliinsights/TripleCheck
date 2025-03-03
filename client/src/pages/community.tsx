import { useQuery } from "@tanstack/react-query";
import { CommunityPost, LegalResource } from "@shared/schema";
import CommunityPostCard from "@/components/community-post-card";
import LegalResourceCard from "@/components/legal-resource-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CommunityPage() {
  const { data: posts } = useQuery<CommunityPost[]>({
    queryKey: ["/api/community-posts"]
  });

  const { data: resources } = useQuery<LegalResource[]>({
    queryKey: ["/api/legal-resources"]
  });

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">Community Trust Network</h1>
        <p className="text-xl text-muted-foreground">
          Share experiences and access legal resources to protect yourself in real estate transactions
        </p>
      </div>

      <Tabs defaultValue="experiences">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="experiences">Community Experiences</TabsTrigger>
          <TabsTrigger value="resources">Legal Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="experiences" className="space-y-6">
          <div className="grid gap-6">
            {posts?.map((post) => (
              <CommunityPostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid gap-6">
            {resources?.map((resource) => (
              <LegalResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
