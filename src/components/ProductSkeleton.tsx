import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCardSkeleton() {
    return (
        <div className="glass-card overflow-hidden">
            <Skeleton className="w-full aspect-[1/1]" />
            <div className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-1/2" />
                <div className="space-y-2 pt-2">
                    <Skeleton className="h-3 w-10" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-12 rounded-full" />
                        <Skeleton className="h-6 w-12 rounded-full" />
                        <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                </div>
                <div className="space-y-2 pt-1">
                    <Skeleton className="h-3 w-10" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-12 rounded-full" />
                        <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                </div>
                <div className="pt-4">
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}

export function ProductDetailSkeleton() {
    return (
        <div className="container-main py-12">
            <Skeleton className="h-4 w-48 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                {/* Image Skeleton */}
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />

                {/* Details Skeleton */}
                <div className="flex flex-col h-full lg:py-4 space-y-8">
                    <div>
                        <Skeleton className="h-12 w-3/4 mb-4" />
                        <Skeleton className="h-6 w-1/2 mb-8" />
                        <Skeleton className="h-10 w-32 mb-8" />

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-3">
                                    <Skeleton className="h-4 w-12" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <div className="flex gap-3">
                                    <Skeleton className="h-10 w-20 rounded-lg" />
                                    <Skeleton className="h-10 w-20 rounded-lg" />
                                    <Skeleton className="h-10 w-20 rounded-lg" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-3">
                                    <Skeleton className="h-4 w-12" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    <Skeleton className="h-10 w-full rounded-lg" />
                                    <Skeleton className="h-10 w-full rounded-lg" />
                                    <Skeleton className="h-10 w-full rounded-lg" />
                                    <Skeleton className="h-10 w-full rounded-lg" />
                                </div>
                            </div>
                            <div className="w-32">
                                <Skeleton className="h-4 w-16 mb-3" />
                                <Skeleton className="h-10 w-32 rounded-lg" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-auto">
                        <Skeleton className="h-14 w-full rounded-xl" />
                        <Skeleton className="h-14 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
