import { LocationVehicle } from "@/models/location-vehicle";
import { MoveLocationVehicleDialog } from "../components/move-location-vehicle-dialog";
import { MapPin } from "lucide-react";
import { LocationCard } from "@/components/shared/location-card";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { LoadingOverlay } from "@/components/shared/loading-overlay";

export default function RiwayatLokasiKendaraanPage() {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(false);

    const [listVehicleLocations, setListVehicleLocations] = useState<LocationVehicle[]>([]);
    const [vehicleIsSold, setVehicleIsSold] = useState(false);

    const fetchVehicleLocations = async (vehicleId: string) => {
        const { data, error } = await supabase
            .from("vehicle_locations")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Vehicle Locations fetch error:", error)
        }

        if (data) {
            setListVehicleLocations(data.map(loc => ({
                id: loc.id,
                locehicleId: loc.vehicle_id,
                name: loc.name,
                address: loc.address,
                createdAt: loc.created_at,
                createdBy: loc.created_by,
            })));
        }
    };

    const fetchVehicleIsSold = async (vehicleId: string) => {
        const { data, error } = await supabase
            .from("vehicles")
            .select("is_sold")
            .eq("id", vehicleId)
            .single();

        if (error) {
            console.error("Vehicle status sold fetch error:", error)
        }

        if (data) {
            setVehicleIsSold(data?.is_sold ?? false);
        }
    };

    useEffect(() => {
        const fetchAll = async () => {
            if (!id) return;
            setLoading(true);

            try {
                await Promise.all([
                    fetchVehicleIsSold(id),
                    fetchVehicleLocations(id)
                ]);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [id]);

    return (
        <>
            <LoadingOverlay loading={loading} />
            
            <div className="min-h-screen flex flex-col">
                <main className="flex-1 md:p-6 flex flex-col gap-5 md:max-w-6xl md:mx-auto md:w-full">
                    <div className="bg-background border rounded-lg p-5 shadow-xs flex flex-col gap-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                            <div className="flex flex-col">
                                <h1 className="text-lg font-semibold">Riwayat Lokasi Kendaraan</h1>
                                {!vehicleIsSold && (
                                    <p className="text-muted-foreground text-sm">Klik button pindah lokasi untuk memindahkan lokasi kendaraan.</p>
                                )}
                            </div>
                            {!vehicleIsSold && (
                                <MoveLocationVehicleDialog
                                    vehicleId={id!}
                                    currLocationAddress={listVehicleLocations[0]?.address}
                                    onSave={() => fetchVehicleLocations(id!)}
                                />
                            )}
                        </div>

                        <div>
                            {listVehicleLocations.length > 0 ? (
                                <div className="relative">
                                    {listVehicleLocations.map((location, index) => (
                                        <div key={location.id} className="relative flex gap-3">
                                            {/* Timeline Left Side */}
                                            <div className="flex flex-col items-center">
                                                <div className="w-4 h-4 bg-secondary rounded-full border-2 border-white"></div>
                                                {index !== listVehicleLocations.length - 1 && (
                                                    <div className="flex-1 w-px bg-secondary"></div>
                                                )}
                                            </div>

                                            {/* Card */}
                                            <div className="flex-1 flex flex-col gap-2 pb-5">
                                                {index === 0 && (
                                                    <p className="text-sm font-medium text-secondary">Lokasi Terakhir</p>
                                                )}
                                                <LocationCard
                                                    name={location.name}
                                                    address={location.address}
                                                    createdAt={location.createdAt}
                                                    createdBy={location.createdBy}
                                                    disabled={index !== 0}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[50vh] flex flex-col items-center justify-center text-center p-4">
                                    <MapPin className="h-5 w-5 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">Belum ada lokasi kendaraan</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
