import { VehicleCard } from "../components/vehicle-card";
import { Input } from "@/components/shadcn/input";
import { Button } from "@/components/shadcn/button";
import { CarFront, Search } from "lucide-react";
import { useState } from "react";
import { Vehicle } from "@/models/vehicle";
import { supabase } from "@/lib/supabaseClient";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { toast } from "sonner";

export default function CariKendaraanPage() {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [lastSearch, setLastSearch] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const fetchVehicle = async () => {
    const cleanedSearch = search.replace(/\s+/g, "").toUpperCase();
    if (cleanedSearch === lastSearch) {
      toast.info("Plat nomor sama, tidak melakukan pencarian ulang.");
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase
        .rpc("search_vehicles_by_plates", { cleaned_plate: cleanedSearch });

      if (error) {
        throw new Error("Gagal search vehicle: " + error.message);
      }

      if (data.length > 0) {
        setVehicle({
          id: data[0].id,
          name: data[0].name,
          type: data[0].type,
          year: data[0].year,
          brand: data[0].brand,
          color: data[0].color,
          category: data[0].category,
          licensePlate: data[0].license_plate,
          image: data[0].image_url,
          isSold: data[0].is_sold,
          soldDate: data[0].sold_date ?? undefined,
          location: {
            id: data[0].location_id ?? "",
            vehicleId: data[0].vehicleid ?? "",
            name: data[0].location_name ?? "Belum ada lokasi",
            address: data[0].location_address ?? "Belum ada alamat",
          },
        });
      } else {
        setVehicle(null);
        throw new Error("Kendaraan tidak ditemukan");
      }

      setLastSearch(cleanedSearch);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mencari data kendaraan: " + error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <LoadingOverlay loading={loading} />

      <div className="min-h-screen flex flex-col">
        <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 md:max-w-6xl md:mx-auto md:w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Cari Kendaraan</h1>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row w-full items-center gap-3">
            <div className="relative flex w-full items-center space-x-2">
              <Search className="h-5 w-5 absolute top-1/2 -translate-y-1/2 left-3 text-medium" />
              <Input
                type="text"
                placeholder="Cari Plat No kendaraan"
                className="w-full pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button className="w-full sm:w-28" onClick={fetchVehicle}>
              <Search /> Cari
            </Button>
          </div>

          {vehicle ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            </div>
          ) : (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center p-4">
              <CarFront className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Data kendaraan tidak ditemukan.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
