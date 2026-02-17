import { Skeleton } from "@/components/ui/skeleton";

export default function CustomizeLoading() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="h-16 bg-white border-b flex items-center px-4">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex h-[calc(100vh-64px)]">
        <Skeleton className="w-80 h-full" />
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-[500px] w-[500px]" />
        </div>
        <Skeleton className="w-80 h-full" />
      </div>
    </div>
  );
}
