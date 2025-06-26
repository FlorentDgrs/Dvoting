"use client";

import { useEffect, useState } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { contractAddress, contractABI } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const VoterList = ({ voterRefresh }: { voterRefresh?: number }) => {
  const { data: voterCount, refetch } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getVoterCount",
    query: { enabled: true },
  });
  const publicClient = usePublicClient();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refetch();
  }, [voterRefresh, refetch]);

  useEffect(() => {
    const fetchVoters = async () => {
      if (!publicClient || voterCount === undefined) {
        setAddresses([]);
        setIsLoading(false);
        return;
      }
      const count = Number(voterCount);
      if (isNaN(count) || count === 0) {
        setAddresses([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const results = await Promise.all(
          Array.from({ length: count }, (_, i) =>
            publicClient.readContract({
              address: contractAddress,
              abi: contractABI,
              functionName: "voterAddresses",
              args: [i],
            })
          )
        );
        setAddresses(results.map((addr) => addr as string));
      } catch {
        setAddresses([]);
      }
      setIsLoading(false);
    };
    fetchVoters();
  }, [voterCount, publicClient]);

  if (isLoading) return <div>Loading...</div>;
  if (addresses.length === 0) return <div>No voters registered yet.</div>;

  return (
    <Card className="p-2">
      <CardHeader className="pb-0 px-2 pt-0 mb-0">
        <CardTitle className="text-xs m-0 p-0 leading-tight">
          Registered Voters ({addresses.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1 pb-1 pt-0 mt-0">
        <ScrollArea className="h-24">
          <div className="space-y-1 pr-2">
            {addresses.map((address) => (
              <div key={address}>
                <p className="text-xs font-mono leading-tight">{address}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default VoterList;
