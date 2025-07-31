import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/shadcn/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { ArrowDownNarrowWide, ArrowUpNarrowWide, Search, Wrench } from "lucide-react";
import { ServiceCard } from "../components/service-card";
import { Service } from "@/models/service";
import { AddServiceDialog } from "../components/add-service-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Button } from "@/components/shadcn/button";
import { CANCELLED, COMPLETED, ONGOING, PENDING, SERVICE_TYPE_PARAM } from "@/lib/constants";
import { supabase } from "@/lib/supabaseClient"
import { getCachedReminderDateRange } from "@/lib/reminder-date";
import { LoadingOverlay } from "@/components/shared/loading-overlay";

type SelectOption = {
  label: string;
  value: string;
};

export default function ServisPage() {
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("todo");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectType, setSelectType] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [selectTypeOptions, setSelectTypeOptions] = useState<SelectOption[]>([]);
  const [listServices, setListServices] = useState<Service[]>([]);

  const fetchServiceTypeParams = async () => {
    // Using static param for now — replace with API call if needed
    const { data, error } = await Promise.resolve(
      {
        data: SERVICE_TYPE_PARAM,
        error: null,
      }
    );

    if (error) {
      console.error("Service Type params fetch error:", error)
    }

    if (data) {
      const optionsFromParams: SelectOption[] = data.map((param) => ({
        label: param.description || param.name,
        value: param.name,
      }));
      setSelectTypeOptions([{ label: "Semua", value: "all" }, ...optionsFromParams]);
    }
  };

  const fetchListServices = async () => {
    const { futureDate } = await getCachedReminderDateRange();

    let serviceQuery = supabase
      .from("service")
      .select(`
        *,
        vehicles (
          id,
          name,
          category,
          license_plate
        )
      `);

    if (activeTab === "todo") {
      serviceQuery = serviceQuery
        .eq("status", PENDING)
        .lte("schedule_date", futureDate.toISOString());
    } else if (activeTab === "pending") {
      serviceQuery = serviceQuery
        .eq("status", PENDING);
    } else if (activeTab === "proses") {
      serviceQuery = serviceQuery
        .eq("status", ONGOING);
    } else {
      serviceQuery = serviceQuery
        .in("status", [COMPLETED, CANCELLED]);
    }

    const { data, error } = await serviceQuery
      .order("schedule_date", { ascending: sortOrder === "asc" });

    if (error) {
      console.error("List Services fetch error:", error)
    }

    if (data) {
      setListServices(data.map(s => ({
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
        status: s.status,
        task: s.task,
        sparepart: s.sparepart,
      })));
    }
  };

  useEffect(() => {
    fetchServiceTypeParams();
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setSearchQuery("");
      setSelectType("all");
      setSortOrder("asc");

      try {
        await fetchListServices();
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [activeTab]);


  const filteredAndSortedService = useMemo(() => {
    const filtered = listServices.filter((service) => {
      const matchesSearch =
        (service.ticketNum && service.ticketNum.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (service.vehicle?.licensePlate && service.vehicle?.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (service.vehicle?.name && service.vehicle?.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (service.task && service.task.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (service.sparepart && service.sparepart.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectType === "all" || service.type?.toLowerCase() === selectType.toLowerCase();

      return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      const dateA = a.scheduleDate ? new Date(a.scheduleDate).getTime() : null;
      const dateB = b.scheduleDate ? new Date(b.scheduleDate).getTime() : null;

      if (dateA === null && dateB === null) return 0;
      if (dateA === null) return sortOrder === "asc" ? 1 : -1;
      if (dateB === null) return sortOrder === "asc" ? -1 : 1;

      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [searchQuery, selectType, sortOrder, listServices]);

  return (
    <>
      <LoadingOverlay loading={loading} />

      <div className="min-h-screen flex flex-col">
        <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 md:max-w-6xl md:mx-auto md:w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Servis</h1>
            <AddServiceDialog onSave={() => fetchListServices()} />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full md:max-w-sm">
              <TabsTrigger value="todo">To-do</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="proses">Proses</TabsTrigger>
              <TabsTrigger value="histori">Histori</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-row flex-wrap md:flex-nowrap gap-3">
                  <div className="relative w-full flex items-center space-x-2">
                    <Search className="h-5 w-5 absolute top-1/2 -translate-y-1/2 left-3 text-medium" />
                    <Input
                      type="text"
                      placeholder="Filter kendaraan dan servis"
                      className="w-full pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

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
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                ) : (
                  <div className="h-[50vh] flex flex-col items-center justify-center text-center p-4">
                    <Wrench className="h-5 w-5 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Data servis tidak ditemukan.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
