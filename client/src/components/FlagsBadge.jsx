import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Flag } from "lucide-react";

export default function FlagsBadge() {
  const { data: flagData, isLoading } = useQuery({
    queryKey: ['/api/user/flags-count'],
    retry: false,
  });

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  const flagCount = flagData?.flags || 0;

  if (flagCount === 0) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">
        <Flag className="w-3 h-3 mr-1" />
        0 Flags
      </Badge>
    );
  }

  return (
    <Badge className="bg-red-100 text-red-600 border-red-200">
      <Flag className="w-3 h-3 mr-1" />
      {flagCount} Flag{flagCount > 1 ? 's' : ''}
    </Badge>
  );
}