import { ArrowDownNarrowWide, ArrowUpNarrowWide, IdCard, Search } from "lucide-react";
import { Administration } from "@/models/administration";
import { AdministrationCard } from "@/features/administrasi/components/administration-card";
import { Input } from "@/components/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Button } from "@/components/shadcn/button";
import { useEffect, useMemo, useState } from "react";
import { ADMINISTRATION_TYPE_PARAM, STATUS_PARAM } from "@/lib/constants";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient"
import { LoadingOverlay } from "@/components/shared/loading-overlay";

type SelectOption = {
    label: string
    value: string
}

export default function AktivitasAdministrasiKendaraanPage() {
    const [loading, setLoading] = useState(false);
    const { id: vehicleId } = useParams();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectType, setSelectType] = useState("all");
    const [selectStatus, setSelectStatus] = useState("all");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

    const [selectTypeOptions, setSelectTypeOptions] = useState<SelectOption[]>([])
    const [selectStatusOptions, setSelectStatusOptions] = useState<SelectOption[]>([])

    const [listAdministrations, setListAdministrations] = useState<Administration[]>([]);



    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);

            try {
                const [paramsType, paramsStatus] = await Promise.all([
                    Promise.resolve(ADMINISTRATION_TYPE_PARAM),
                    Promise.resolve(STATUS_PARAM),
                ]);

                setSelectTypeOptions([{ label: "Semua", value: "all" }, ...paramsType.map((p) => ({
                    label: p.description || p.name,
                    value: p.name
                }))]);

                setSelectStatusOptions([{ label: "Semua", value: "all" }, ...paramsStatus.map((p) => ({
                    label: p.description || p.name,
                    value: p.name
                }))]);

                const { data, error } = await supabase
                    .from("administration")
                    .select(`
                        id, ticket_num, vehicle_id, type, due_date, end_date, status,
                        vehicles:vehicle_id (id, name, category, license_plate)
                    `)
                    .eq("vehicle_id", vehicleId)
                    .order("due_date", { ascending: sortOrder === "asc" });

                if (error) {
                    console.error("Failed to fetch administrations:", error);
                } else {
                    const mapped = data.map((a: any) => ({
                        id: a.id,
                        ticketNum: a.ticket_num,
                        vehicleId: a.vehicle_id,
                        vehicle: {
                            id: a.vehicles?.id,
                            name: a.vehicles?.name,
                            category: a.vehicles?.category,
                            licensePlate: a.vehicles?.license_plate,
                        },
                        type: a.type,
                        dueDate: a.due_date,
                        endDate: a.end_date,
                        status: a.status,
                    }));

                    setListAdministrations(mapped);
                }

            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (vehicleId) fetchAll();
    }, [vehicleId]);

    const filteredAndSortedAdministration = useMemo(() => {
        const filtered = listAdministrations.filter((administration) => {
            const matchesSearch =
                (administration.ticketNum && administration.ticketNum.toLowerCase().includes(searchQuery.toLowerCase()))
            const matchesType = selectType === "all" || administration.type?.toLowerCase() === selectType.toLowerCase()
            const matchesStatus = selectStatus === "all" || administration.status?.toLowerCase() === selectStatus.toLowerCase()

            return matchesSearch && matchesType && matchesStatus;
        })

        filtered.sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : null;
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : null;

            if (dateA === null && dateB === null) return 0;
            if (dateA === null) return sortOrder === "asc" ? 1 : -1;
            if (dateB === null) return sortOrder === "asc" ? -1 : 1;

            return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        })

        return filtered
    }, [searchQuery, selectType, selectStatus, listAdministrations, sortOrder])

    return (
        <>
            <LoadingOverlay loading={loading} />

            <div className="min-h-screen flex flex-col">
                {/* Main content */}
                <main className="flex-1 md:p-6 flex flex-col gap-5 md:max-w-6xl md:mx-auto md:w-full">
                    <div className="bg-background border rounded-lg p-5 shadow-xs flex flex-col gap-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                            <div className="flex flex-col">
                                <h1 className="text-lg font-semibold">Aktivitas Administrasi Kendaraan</h1>
                                <p className="text-muted-foreground text-sm">Daftar aktivitas administrasi kendaraan.</p>
                            </div>
                        </div>

                        <div className="flex flex-row flex-wrap md:flex-nowrap gap-3">
                            {/* Search Bar */}
                            <div className="relative w-full flex items-center space-x-2">
                                <Search className="h-5 w-5 absolute top-1/2 -translate-y-1/2 left-3 text-medium" />
                                <Input
                                    type="text"
                                    placeholder="Filter aktivitas administrasi"
                                    className="w-full pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Select Type */}
                            <Select onValueChange={setSelectType} value={selectType}>
                                <SelectTrigger>
                                    <span className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Tipe Administrasi:</span>
                                        <SelectValue placeholder="Pilih tipe administrasi" />
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
                                Total Data: <span className="font-medium">{filteredAndSortedAdministration.length}</span>
                            </p>
                        </div>

                        {filteredAndSortedAdministration.length > 0 ? (
                            <div className="flex flex-col gap-5">
                                {filteredAndSortedAdministration.map((administration) => (
                                    <AdministrationCard
                                        key={administration.id}
                                        administration={administration}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="h-[50vh] flex flex-col items-center justify-center text-center p-4">
                                <IdCard className="h-5 w-5 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Aktivitas administrasi tidak ditemukan.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    )
}
