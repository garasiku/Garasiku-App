import type React from "react"
import { useEffect, useRef, useState } from "react"
import { ImageIcon, ImagePlus, Trash } from "lucide-react"
import imageCompression from "browser-image-compression"
import { v4 as uuidv4 } from "uuid"

import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/shadcn/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/shadcn/dialog"
import { ScrollArea } from "@/components/shadcn/scroll-area"
import { toast } from "sonner"
import { LoadingOverlay } from "@/components/shared/loading-overlay"

interface EditImageVehicleDialogProps {
    images: string[]
    vehicleId: string
    onSave?: (images: string[]) => void
}

export function EditImageVehicleDialog({
    images = [],
    vehicleId,
    onSave,
}: EditImageVehicleDialogProps) {
    const [loading, setLoading] = useState(false);

    const [open, setOpen] = useState(false)
    const [vehicleImages, setVehicleImages] = useState<string[]>([...images])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [deletedImages, setDeletedImages] = useState<string[]>([])

    const [publicUrls, setPublicUrls] = useState<Record<string, string>>({});

    useEffect(() => {
        const map: Record<string, string> = {};
        vehicleImages.forEach((img) => {
            if (img.startsWith("blob:")) {
                map[img] = img;
            } else {
                const url = supabase.storage.from("vehicle").getPublicUrl(img).data.publicUrl;
                map[img] = url ?? "/placeholder.svg";
            }
        });
        setPublicUrls(map);
    }, [vehicleImages]);

    useEffect(() => {
        return () => {
            vehicleImages.forEach((img) => {
                if (img.startsWith("blob:")) {
                    URL.revokeObjectURL(img);
                }
            });
        };
    }, []);

    const handleAddImage = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = 6 - vehicleImages.length;
        if (remainingSlots <= 0) {
            toast.warning("Maksimum 6 foto kendaraan diperbolehkan.");
            return;
        }

        const filesToProcess = Array.from(files).slice(0, remainingSlots);

        const compressedImages: string[] = []

        for (let i = 0; i < filesToProcess.length; i++) {
            try {
                const options = {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 1280,
                    useWebWorker: true,
                    fileType: "image/webp",
                }
                const compressedFile = await imageCompression(filesToProcess[i], options)
                const url = URL.createObjectURL(compressedFile)
                compressedImages.push(url)
            } catch (error) {
                console.error("Compression failed:", error)
            }
        }

        setVehicleImages((prev) => [...prev, ...compressedImages])
    }

    const handleDeleteImage = (index: number) => {
        const removed = vehicleImages[index];
        const updated = [...vehicleImages];
        updated.splice(index, 1);
        setVehicleImages(updated);

        // Simpan ke daftar hapus jika bukan blob (sudah diupload)
        if (!removed.startsWith("blob:")) {
            setDeletedImages((prev) => [...prev, removed]);
        }
    };

    async function deleteImagesFromStorageAndDB(urls: string[]) {
        for (const url of urls) {
            try {
                // 1. Hapus dari storage
                const { error: storageError } = await supabase
                    .storage
                    .from("vehicle")
                    .remove([url]);

                if (storageError) {
                    throw new Error("Gagal hapus file dari storage: " + storageError.message);
                }

                // 2. Hapus dari attachment_vehicle
                const { error: dbError } = await supabase
                    .from("attachment_vehicle")
                    .delete()
                    .eq("file_link", url);

                if (dbError) {
                    throw new Error("Gagal hapus data attachment_vehicle: " + dbError.message);
                }
            } catch (error) {
                console.error("Error deleting file:", error);
            }
        }
    }

    async function uploadImagesToStorage(files: File[], vehicleId: string): Promise<string[]> {
        const uploadedUrls: string[] = [];

        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${vehicleId}/gallery/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("vehicle")
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                throw new Error("Gagal upload image: " + uploadError.message);
            }

            uploadedUrls.push(filePath);

            await supabase.from("attachment_vehicle").insert({
                vehicle_id: vehicleId,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size.toString(),
                file_link: filePath,
                created_by: "system",
                attachment_type: "gallery",
            });
        }

        return uploadedUrls;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);

        try {
            const newBlobs = vehicleImages.filter((img) => img.startsWith("blob:"));
            const filesToUpload: File[] = [];

            for (const blobUrl of newBlobs) {
                const blob = await fetch(blobUrl).then((res) => res.blob());
                const file = new File([blob], `image-${Date.now()}.webp`, { type: 'image/webp' });
                filesToUpload.push(file);
            }

            // Upload gambar baru
            const uploadedUrls = await uploadImagesToStorage(filesToUpload, vehicleId);

            // Gabung yang lama (selain blob) + hasil upload
            const finalImages = vehicleImages.filter((img) => !img.startsWith("blob:")).concat(uploadedUrls);

            // Hapus gambar yang ditandai
            if (deletedImages.length > 0) {
                await deleteImagesFromStorageAndDB(deletedImages);
            }

            toast.success("Foto kendaraan berhasil diperbarui.");
            if (onSave) {
                onSave(finalImages);
            }
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan foto kendaraan: " + error);
        } finally {
            setLoading(false);
        }
    };

    function handleDialogChange(isOpen: boolean) {
        setOpen(isOpen);
        if (!isOpen) {
            setVehicleImages([...images]);
            setDeletedImages([]);
        }
    }

    return (
        <>
            <LoadingOverlay loading={loading} />

            <Dialog open={open && !loading} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="absolute top-2 right-2 bg-background hover:bg-background shadow-md">
                        <ImageIcon />
                        Ubah
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] md:max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Foto Kendaraan</DialogTitle>
                        <DialogDescription>Atur foto kendaraan dan klik button simpan.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="flex-1">Total Foto: {vehicleImages.length}</div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <Button type="button" onClick={handleAddImage} disabled={vehicleImages.length >= 6}>
                                    <ImagePlus />
                                    Tambah
                                </Button>
                            </div>

                            <ScrollArea className="h-[50vh]">
                                {vehicleImages.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                        {vehicleImages.map((image, index) => (
                                            <div key={image} className="group relative flex items-center gap-4">
                                                <div className="relative aspect-video w-full overflow-hidden">
                                                    <img src={publicUrls[image]} alt={`Car image ${index + 1}`} className="object-cover w-full h-full" />
                                                    <div className="absolute bottom-2 left-2 flex items-center justify-center bg-background/80 size-8 rounded-full shadow-md">
                                                        <span className="text-foreground text-sm">{index + 1}</span>
                                                    </div>
                                                    <Button type="button" onClick={() => handleDeleteImage(index)} variant="outline" size="icon" className="absolute top-2 right-2 rounded-full bg-background/80 hover:bg-background shadow-md">
                                                        <Trash />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-[50vh] flex flex-col items-center justify-center text-center p-4">
                                        <ImageIcon className="h-5 w-5 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">Belum ada foto kendaraan</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Batal</Button>
                            </DialogClose>
                            <Button type="submit">Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
