import { ArrowDownNarrowWide, ArrowUpNarrowWide, Search, Wrench } from "lucide-react";
import { Service } from "@/models/service";
import { ServiceCard } from "@/features/servis/components/service-card";
import { Input } from "@/components/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Button } from "@/components/shadcn/button";
import { useEffect, useMemo, useState } from "react";
import { SERVICE_TYPE_PARAM, STATUS_PARAM } from "@/lib/constants";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient"
import { LoadingOverlay } from "@/components/shared/loading-overlay";

type SelectOption = {
    label: string
    value: string
}

export default function AktivitasServisKendaraanPage() {
    const [loading, setLoading] = useState(false);
    const { id: vehicleId } = useParams();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectType, setSelectType] = useState("all");
    const [selectStatus, setSelectStatus] = useState("all");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

    const [selectTypeOptions, setSelectTypeOptions] = useState<SelectOption[]>([])
    const [selectStatusOptions, setSelectStatusOptions] = useState<SelectOption[]>([])

    const [listServices, setListServices] = useState<Service[]>([]);


    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);

            try {

                const [typeParams, statusParams] = await Promise.all([
                    Promise.resolve(SERVICE_TYPE_PARAM),
                    Promise.resolve(STATUS_PARAM),
                ]);

                // Ambil data service + relasi kendaraan
                const { data: servicesData, error: servicesError } = await supabase
                    .from("service")
                    .select(`
                        id, ticket_num, vehicle_id, type, schedule_date, start_date, end_date,
                        status, task, sparepart, material,
                        vehicles:vehicle_id(id, name, category, license_plate)
                    `)
                    .eq("vehicle_id", vehicleId)
                    .order("schedule_date", { ascending: sortOrder === "asc" });

                if (servicesError) {
                    console.error("Failed to fetch services:", servicesError);
                } else if (servicesData) {
                    const mappedServices = servicesData.map((s: any) => ({
                        id: s.id,
                        ticketNum: s.ticket_num,
                        vehicleId: s.vehicle_id,
                        vehicle: {
                            id: s.vehicles?.id,
                            name: s.vehicles?.name,
                            category: s.vehicles?.category,
                            licensePlate: s.vehicles?.license_plate,
                        },
                        type: s.type,
                        scheduleDate: s.schedule_date,
                        startDate: s.start_date,
                        endDate: s.end_date,
                        status: s.status,
                        task: s.task,
                        sparepart: s.sparepart,
                        material: s.material,
                    }));
                    setListServices(mappedServices);
                }

                // set options
                const optionsType = typeParams.map(p => ({ label: p.description || p.name, value: p.name }));
                setSelectTypeOptions([{ label: "Semua", value: "all" }, ...optionsType]);

                const optionsStatus = statusParams.map(p => ({ label: p.description || p.name, value: p.name }));
                setSelectStatusOptions([{ label: "Semua", value: "all" }, ...optionsStatus]);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);


    const filteredAndSortedService = useMemo(() => {
        const filtered = listServices.filter((service) => {
            const matchesSearch =
                (service.ticketNum && service.ticketNum.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (service.task && service.task.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (service.sparepart && service.sparepart.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (service.material && service.material.toLowerCase().includes(searchQuery.toLowerCase()))
            const matchesType = selectType === "all" || service.type?.toLowerCase() === selectType.toLowerCase()
            const matchesStatus = selectStatus === "all" || service.status?.toLowerCase() === selectStatus.toLowerCase()

            return matchesSearch && matchesType && matchesStatus;
        })

        filtered.sort((a, b) => {
            const dateA = a.scheduleDate ? new Date(a.scheduleDate).getTime() : null;
            const dateB = b.scheduleDate ? new Date(b.scheduleDate).getTime() : null;

            if (dateA === null && dateB === null) return 0;
            if (dateA === null) return sortOrder === "asc" ? 1 : -1;
            if (dateB === null) return sortOrder === "asc" ? -1 : 1;

            return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        })

        return filtered
    }, [searchQuery, selectType, selectStatus, listServices, sortOrder])

    return (
        <>
            <LoadingOverlay loading={loading} />
            <div className="min-h-screen flex flex-col">
                {/* Main content */}
                <main className="flex-1 md:p-6 flex flex-col gap-5 md:max-w-6xl md:mx-auto md:w-full">
                    <div className="bg-background border rounded-lg p-5 shadow-xs flex flex-col gap-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                            <div className="flex flex-col">
                                <h1 className="text-lg font-semibold">Aktivitas Servis Kendaraan</h1>
                                <p className="text-muted-foreground text-sm">Daftar aktivitas servis kendaraan.</p>
                            </div>
                        </div>

                        <div className="flex flex-row flex-wrap md:flex-nowrap gap-3">
                            {/* Search Bar */}
                            <div className="relative w-full flex items-center space-x-2">
                                <Search className="h-5 w-5 absolute top-1/2 -translate-y-1/2 left-3 text-medium" />
                                <Input
                                    type="text"
                                    placeholder="Filter aktivitas servis"
                                    className="w-full pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Select Type */}
                            <Select onValueChange={setSelectType} value={selectType}>
                                <SelectTrigger>
                                    <span className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Tipe Servis:</span>
                                        <SelectValue placeholder="Pilih tipe servis" />
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    {selectTypeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Select Status */}
                            <Select onValueChange={setSelectStatus} value={selectStatus}>
                                <SelectTrigger>
                                    <span className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Status:</span>
                                        <SelectValue placeholder="Pilih status" />
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    {selectStatusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Sort Order */}
                            <Button
                                variant="outline"
                                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                className="flex items-center gap-2 w-fit"
                            >
                                {sortOrder === "asc" ? (
                                    <ArrowUpNarrowWide className="h-4 w-4" />
                                ) : (
                                    <ArrowDownNarrowWide className="h-4 w-4" />
                                )}
                                Sort Tanggal
                            </Button>
                        </div>

                        <div className="flex items-center">
                            <p className="text-sm text-muted-foreground">
                                Total Data: <span className="font-medium">{filteredAndSortedService.length}</span>
                            </p>
                        </div>

                        {filteredAndSortedService.length > 0 ? (
                            <div className="flex flex-col gap-5">
                                {filteredAndSortedService.map((service) => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="h-[50vh] flex flex-col items-center justify-center text-center p-4">
                                <Wrench className="h-5 w-5 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Aktivitas servis tidak ditemukan.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    )
}
