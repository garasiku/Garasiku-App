import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/shadcn/carousel";
import { EditImageVehicleDialog } from "./edit-image-vehicle-dialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabaseClient";

interface ImageCarouselProps {
    images: string[];
    vehicleId: string;
    onSave?: () => void;
}

export function ImageCarousel({ images, vehicleId, onSave }: ImageCarouselProps) {
    const { isOwner, isDivisi } = useAuth();

    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)

    const [displayImages, setDisplayImages] = useState<string[]>([]);

    useEffect(() => {
        if (!api) return;

        // Update count and current on new images or selection
        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        const handleSelect = () => {
            setCurrent(api.selectedScrollSnap() + 1);
        };

        api.on("select", handleSelect);

        // Clean up old listeners to avoid stacking
        return () => {
            api.off("select", handleSelect);
        };
    }, [api, images.length]);

    useEffect(() => {
        const urls = images.map((img) => {
            if (img.startsWith("blob:")) return img;
            return supabase.storage.from("vehicle").getPublicUrl(img).data.publicUrl ?? "/placeholder.svg";
        });
        setDisplayImages(urls);
    }, [images]);

    if (!images || images.length === 0) {
        return (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                {(isOwner || isDivisi) && (
                    <EditImageVehicleDialog images={images} vehicleId={vehicleId} onSave={onSave} />
                )}
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Main Carousel */}
            <Carousel
                key={images.length}
                opts={{
                    loop: true,
                }}
                className="w-full"
                setApi={setApi}
            >
                <CarouselContent>
                    {images.map((image, index) => (
                        <CarouselItem key={image}>
                            <div className="aspect-video w-full overflow-hidden">
                                <img
                                    src={displayImages[index]}
                                    alt={`Image ${index + 1}`}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious
                    className="left-2 bg-background/80 hover:bg-background shadow-md"
                />
                <CarouselNext
                    className="right-2 bg-background/80 hover:bg-background shadow-md"
                />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center bg-background/80 px-5 py-1 rounded-xl shadow-md">
                    <span className="text-foreground text-sm">{current} / {count}</span>
                </div>

                {(isOwner || isDivisi) && (
                    <EditImageVehicleDialog images={images} vehicleId={vehicleId} onSave={onSave} />
                )}
            </Carousel>
        </div>
    );
}