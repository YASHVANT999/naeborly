import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Flag } from "lucide-react";
import { Link } from "wouter";

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
      <Link href="/flags">
        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 cursor-pointer transition-colors">
          <Flag className="w-3 h-3 mr-1" />
          0 Flags
        </Badge>
      </Link>
    );
  }

  return (
    <Link href="/flags">
      <Badge className="bg-red-100 text-red-600 border-red-200 hover:bg-red-200 cursor-pointer transition-colors">
        <Flag className="w-3 h-3 mr-1" />
        {flagCount} Flag{flagCount > 1 ? 's' : ''}
      </Badge>
    </Link>
  );
}