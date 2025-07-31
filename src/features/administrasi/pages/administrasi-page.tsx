import { Input } from "@/components/shadcn/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Administration } from "@/models/administration";
import { ArrowDownNarrowWide, ArrowUpNarrowWide, IdCard, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdministrationCard } from "../components/administration-card";
import { Button } from "@/components/shadcn/button";
import { Navigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { getCachedReminderDateRange } from "@/lib/reminder-date";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { AddAdministrationDialog } from "../components/add-administration-dialog";
import { CANCELLED, COMPLETED, PENDING } from "@/lib/constants";

const validTypes = ["stnk-1", "stnk-5", "asuransi"];

export default function AdministrasiPage() {
  const [loading, setLoading] = useState(false);

  const { type } = useParams();
  if (!type || !validTypes.includes(type)) {
    return <Navigate to="/administrasi/stnk-1" replace />;
  }

  const [activeTab, setActiveTab] = useState("todo");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [listAdministrations, setListAdministrations] = useState<Administration[]>([]);

  const fetchListAdministrations = async () => {
    const { futureDate } = await getCachedReminderDateRange();

    let administrationQuery = supabase
      .from("administration")
      .select(`
        *,
        vehicles (
          id,
          name,
          category,
          license_plate
        )
      `)
      .eq("type", `administrasi-${type}`);

    if (activeTab === "todo") {
      administrationQuery = administrationQuery
        .eq("status", PENDING)
        .lte("due_date", futureDate.toISOString());
    } else if (activeTab === "pending") {
      administrationQuery = administrationQuery
        .eq("status", PENDING);
    } else {
      administrationQuery = administrationQuery
        .in("status", [COMPLETED, CANCELLED])
    }

    const { data, error } = await administrationQuery
      .order("due_date", { ascending: sortOrder === "asc" });

    if (error) {
      console.error("List Administrations fetch error:", error)
    }

    if (data) {
      setListAdministrations(data.map(a => ({
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
      })));
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      try {
        await fetchListAdministrations();
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [activeTab, type]);

  useEffect(() => {
    setSearchQuery("");
  }, [activeTab, type]);

  useEffect(() => {
    setActiveTab("todo");
  }, [type]);

  const filteredAndSortedAdministration = useMemo(() => {
    const filtered = listAdministrations.filter((administration) => {
      const matchesSearch =
        (administration.ticketNum?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (administration.vehicle?.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (administration.vehicle?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });

    filtered.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : null;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : null;

      if (dateA === null && dateB === null) return 0;
      if (dateA === null) return sortOrder === "asc" ? 1 : -1;
      if (dateB === null) return sortOrder === "asc" ? -1 : 1;

      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [activeTab, searchQuery, listAdministrations, sortOrder]);

  return (
    <>
      <LoadingOverlay loading={loading} />

      <div className="min-h-screen flex flex-col">
        <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 md:max-w-6xl md:mx-auto md:w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Administrasi</h1>
            <AddAdministrationDialog onSave={() => fetchListAdministrations()} />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full md:max-w-sm">
              <TabsTrigger value="todo">To-do</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="histori">Histori</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-row flex-wrap md:flex-nowrap gap-3">
                  {/* Search Bar */}
                  <div className="relative w-full flex items-center space-x-2">
                    <Search className="h-5 w-5 absolute top-1/2 -translate-y-1/2 left-3 text-medium" />
                    <Input
                      type="text"
                      placeholder="Filter kendaraan dan administrasi"
                      className="w-full pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Sort Order */}
                  <Button
                    variant="outline"
                    onClick={() =>
                      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                    }
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
                    <p className="text-sm text-muted-foreground">
                      Data administrasi tidak ditemukan.
                    </p>
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
