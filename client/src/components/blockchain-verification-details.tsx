import { useQuery } from "@tanstack/react-query";
import { BlockchainVerification } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Clock, FileCheck } from "lucide-react";

interface BlockchainVerificationDetailsProps {
  propertyId: number;
}

export default function BlockchainVerificationDetails({ propertyId }: BlockchainVerificationDetailsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/properties', propertyId, 'verification'],
    enabled: !!propertyId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const verification: BlockchainVerification = data?.blockchainVerification;

  if (!verification) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-5 w-5" />
            <span>Blockchain verification pending</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#008080]" />
          Blockchain Verification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Title Deed Status</h4>
            <div className="flex items-center gap-2 text-[#38A169]">
              <FileCheck className="h-4 w-4" />
              <span>Verified on Blockchain</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Transaction Details</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Block Number: {verification.blockNumber}</p>
              <p>Transaction Hash: {verification.transactionHash.slice(0, 10)}...</p>
              <p>Timestamp: {new Date(verification.timestamp).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Ownership History</h4>
            <div className="space-y-2">
              {verification.verificationData.ownershipHistory.map((record, index) => (
                <div key={index} className="text-sm text-gray-600">
                  <p>Owner: {record.owner}</p>
                  <p>Date: {new Date(record.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <a
              href={`https://etherscan.io/tx/${verification.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#008080] hover:underline"
            >
              View on Blockchain Explorer
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
