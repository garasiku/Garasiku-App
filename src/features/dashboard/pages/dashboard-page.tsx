import { useEffect, useMemo, useState } from "react";
import { Notebook, Tag, Truck, Wrench } from "lucide-react";
import { DashboardCard } from "../components/dashboard-card";
import { supabase } from "@/lib/supabaseClient";
import { getCachedReminderDateRange } from "@/lib/reminder-date";
import { useAuth } from "@/lib/auth-context";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { PENDING } from "@/lib/constants";

export default function DashboardPage() {
  const { user, isOwner, isDivisi, isWSHead } = useAuth();
  const [loading, setLoading] = useState(false);

  const [activeVehicleCount, setActiveVehicleCount] = useState(0);
  const [soldVehicleCount, setSoldVehicleCount] = useState(0);
  const [todoServiceCount, setTodoServiceCount] = useState(0);
  const [todoAdministrationCount, setTodoAdministrationCount] = useState(0);

  const userMeta = useMemo(() => {
    if (!user) return null;
    const meta = user.user_metadata || {};
    return {
      fullname: meta.fullname || "Nama Pengguna"
    };
  }, [user]);

  const fetchActiveVehicleCount = async () => {
    const { count, error } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("is_sold", false);

    if (error) {
      console.error("Active Vehicle Count fetch error:", error)
    }

    if (count) {
      setActiveVehicleCount(count || 0);
    }
  };

  const fetchSoldVehicleCount = async () => {
    const { count, error } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("is_sold", true);

    if (error) {
      console.error("Sold Vehicle Count fetch error:", error)
    }

    if (count) {
      setSoldVehicleCount(count || 0);
    }
  };

  const fetchTodoServiceCount = async (futureDate: Date) => {
    const { count, error } = await supabase
      .from("service").select("*", { count: "exact", head: true })
      .eq("status", PENDING)
      .lte("schedule_date", futureDate.toISOString());

    if (error) {
      console.error("Todo Service Count fetch error:", error)
    }

    if (count) {
      setTodoServiceCount(count || 0);
    }
  };

  const fetchTodoAdministrationCount = async (futureDate: Date) => {
    const { count, error } = await supabase
      .from("administration")
      .select("*", { count: "exact", head: true })
      .eq("status", PENDING)
      .lte("due_date", futureDate.toISOString());

    if (error) {
      console.error("Todo Administration Count fetch error:", error)
    }

    if (count) {
      setTodoAdministrationCount(count || 0);
    }
  };

  useEffect(() => {
    const fetchCounts = async () => {
      if (!(isOwner || isDivisi || isWSHead)) return;
      setLoading(true);

      try {
        const { futureDate } = await getCachedReminderDateRange();

        const promises: Promise<any>[] = [];

        if (isOwner || isDivisi) {
          promises.push(fetchActiveVehicleCount());
          promises.push(fetchSoldVehicleCount());
          promises.push(fetchTodoAdministrationCount(futureDate));
        }

        if (isOwner || isDivisi || isWSHead) {
          promises.push(fetchTodoServiceCount(futureDate));
        }

        await Promise.all(promises);
      } catch (error) {
        console.error("Terjadi kesalahan pada sistem: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [isOwner, isDivisi, isWSHead]);

  return (
    <>
      <LoadingOverlay loading={loading} />

      <div className="min-h-screen flex flex-col">
        <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 md:max-w-6xl md:mx-auto md:w-full">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang, {userMeta?.fullname}!</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(isOwner || isDivisi) && (
              <DashboardCard
                title="Kendaraan Aktif"
                count={activeVehicleCount}
                urlLink="garasi/daftar-kendaraan/active"
                icon={Truck}
                className="col-span-1"
                background="bg-secondary"
                text="text-secondary-foreground"
              />
            )}

            {(isOwner || isDivisi) && (
              <DashboardCard
                title="Kendaraan Terjual"
                count={soldVehicleCount}
                urlLink="garasi/daftar-kendaraan/sold"
                icon={Tag}
                className="col-span-1"
                background="border bg-background"
                text=""
              />
            )}

            {(isOwner || isDivisi || isWSHead) && (
              <DashboardCard
                title="To-do Servis"
                count={todoServiceCount}
                urlLink="servis"
                icon={Wrench}
                className="col-span-1"
                background="bg-tertiary"
                text="text-tertiary-foreground"
              />
            )}

            {(isOwner || isDivisi) && (
              <DashboardCard
                title="To-do Administrasi"
                count={todoAdministrationCount}
                urlLink="administrasi/stnk-1"
                icon={Notebook}
                className="col-span-1"
                background="bg-quarternary"
                text="text-quarternary-foreground"
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
}
