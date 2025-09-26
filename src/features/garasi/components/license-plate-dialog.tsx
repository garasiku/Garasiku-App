import { Button } from "@/components/shadcn/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shadcn/dialog"
import SectionItem from "@/components/shared/section-item"
import { LicensePlateVehicle } from "@/models/license-plate-vehicle"
import { History } from "lucide-react"
import { useEffect, useState } from "react"
import { ChangeLicensePlateDialog } from "./change-license-plate-dialog"
import { supabase } from "@/lib/supabaseClient"
import { formatDateTime } from "@/lib/utils"
import { LoadingOverlay } from "@/components/shared/loading-overlay"
import { useAuth } from "@/lib/auth-context"

interface LicensePlateDialogProps {
    vehicleId?: string;
    currPlateNo?: string;
    onLicensePlateChange?: (newLicensePlate: string) => void;
}

export function LicensePlateDialog({ vehicleId, currPlateNo, onLicensePlateChange }: LicensePlateDialogProps) {
    const { isOwner, isSecretary } = useAuth();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false)
    const [listVehicleLicensePlates, setListVehicleLicensePlates] = useState<LicensePlateVehicle[]>([]);

    const fetchVehicleLicensePlates = async (vehicleId: string) => {
        const { data, error } = await supabase
            .from("vehicle_plate_history")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("Vehicle License Plates fetch error:", error);
        }

        if (data) {
            setListVehicleLicensePlates(data.map(v => ({
                id: v.id,
                vehicleId: v.vehicle_id,
                plateNo: v.plat_no,
                updatedAt: v.updated_at,
                updatedBy: v.updated_by,
            })));
        }
    }

    useEffect(() => {
        if (!open) return;

        const fetchAll = async () => {
            if (!vehicleId) return;
            setLoading(true);

            try {
                await fetchVehicleLicensePlates(vehicleId);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [vehicleId, open]);

    return (
        <>
            <LoadingOverlay loading={loading} />

            <Dialog open={open} onOpenChange={setOpen}>
                {(isOwner || isSecretary) ? (
                    <DialogTrigger asChild>
                        <Button asChild variant="outline">
                            <span className="font-medium">{currPlateNo}</span>
                        </Button>
                    </DialogTrigger>
                ) : (
                    <Button variant="outline">
                        <span className="font-medium">{currPlateNo}</span>
                    </Button>
                )}
                <DialogContent className="max-h-[90vh] md:max-w-3xl overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Riwayat Plat No Kendaraan</DialogTitle>
                        <DialogDescription>Klik button ubah plat no untuk mengubah plat no kendaraan.</DialogDescription>
                    </DialogHeader>

                    <div className="w-full flex">
                        <ChangeLicensePlateDialog
                            vehicleId={vehicleId}
                            currPlateNo={currPlateNo}
                            onSave={(newPlateNo) => {
                                fetchVehicleLicensePlates(vehicleId!)
                                if (onLicensePlateChange) {
                                    onLicensePlateChange(newPlateNo.plateNo || "");
                                }
                            }}
                            setLoading={setLoading}
                        />
                    </div>

                    {listVehicleLicensePlates.length > 0 ? (
                        <div className="flex flex-col gap-5">
                            {listVehicleLicensePlates.map((licensePlate) => (
                                <div key={licensePlate.id} className="w-full flex px-4 py-3 border rounded-lg shadow-xs bg-background">
                                    <div className="w-full flex flex-col gap-4">
                                        <div className="w-full">
                                            <p className="text-sm font-medium">{licensePlate.plateNo}</p>
                                        </div>
                                        <div className="w-full grid grid-cols-2 gap-5 text-xs text-gray-400">
                                            <SectionItem label="Diubah Pada" value={formatDateTime(licensePlate.updatedAt)} />
                                            <SectionItem label="Diubah Oleh" value={licensePlate.updatedBy} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[50vh] flex flex-col items-center justify-center text-center p-4">
                            <History className="h-5 w-5 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Belum ada riwayat plat no kendaraan</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}