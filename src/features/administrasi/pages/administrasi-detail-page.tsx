import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { SectionCard } from "@/components/shared/section-card";
import SectionItem from "@/components/shared/section-item";
import { Button } from "@/components/shadcn/button";
import { Separator } from "@/components/shadcn/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcn/alert-dialog";
import { Administration } from "@/models/administration";
import TaskTypeBar from "@/components/shared/task-type-bar";
import StatusBar from "@/components/shared/status-bar";
import { CANCELLED, PENDING, Status } from "@/lib/constants";
import { DataBarCard } from "@/components/shared/data-bar-card";
import { CompleteAdministrationDialog } from "../components/complete-administration-dialog";
import { supabase } from "@/lib/supabaseClient";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner"
import { formatDate, formatRupiah } from "@/lib/utils";
import { LoadingOverlay } from "@/components/shared/loading-overlay";

export default function AdministrasiDetailPage() {
  const [loading, setLoading] = useState(false);

  const { id } = useParams<{ id: string }>();
  const [administration, setAdministration] = useState<Administration | null>(null);

  const fetchAdministrationDetail = async (administrationId: string) => {
    const { data, error } = await supabase
      .from("administration")
      .select(`
        *,
        vehicles (
          id,
          name,
          category,
          year,
          brand,
          color,
          type,
          license_plate
        )
      `)
      .eq("id", administrationId)
      .single();

    if (error) {
      console.error("Administration detail fetch error:", error)
    }

    if (data) {
      setAdministration({
        id: data.id,
        ticketNum: data.ticket_num,
        vehicleId: data.vehicle_id,
        vehicle: {
          id: data.vehicles?.id,
          name: data.vehicles?.name,
          category: data.vehicles?.category,
          year: data.vehicles?.year,
          brand: data.vehicles?.brand,
          color: data.vehicles?.color,
          type: data.vehicles?.type,
          licensePlate: data.vehicles?.license_plate,
        },
        type: data.type,
        dueDate: data.due_date,
        endDate: data.end_date,
        status: data.status as Status,
        totalCost: data.total_cost,
        notes: data.notes,
        newDueDate: data.new_due_date,
      });
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);

      try {
        await fetchAdministrationDetail(id);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleCancelAdministration = async () => {
    if (!administration) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("administration")
        .update({ status: CANCELLED })
        .eq("id", administration.id);

      if (error) {
        toast.error("Gagal mengupdate administration " + error.message);
      }

      toast.success("Berhasil membatalkan administrasi.");
      await fetchAdministrationDetail(administration.id!);
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan pada sistem: " + error);
    } finally {
      setLoading(false);
    }
  };

  if (!administration && !loading) return (
    <EmptyState title="Administrasi Tidak Ditemukan" description="Administrasi dengan ID tersebut tidak tersedia." />
  );

  if (!administration) return null;

  return (
    <>
      <LoadingOverlay loading={loading} />

      <div className="min-h-screen flex flex-col">
        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 md:max-w-6xl md:mx-auto md:w-full">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 rounded-lg border bg-background p-5">
              <div>
                <h1 className="text-3xl font-bold">{administration.ticketNum}</h1>
              </div>

              <Separator />

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-5">
                  <div className="flex items-start justify-between">
                    <TaskTypeBar taskType={administration.type} />
                    <StatusBar status={administration.status as Status} />
                  </div>
                  <div className="flex items-end justify-between">
                    <SectionItem label="Jatuh Tempo" value={formatDate(administration.dueDate)} />
                    <SectionItem label="Administrasi Selesai" value={formatDate(administration.endDate)} />
                  </div>
                </div>

                {administration.status == PENDING && (
                  <div className="flex flex-col-reverse gap-3 sm:grid sm:grid-cols-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Batalkan Administrasi</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Batalkan Administrasi?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin membatalkan administrasi {administration.ticketNum}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Tidak</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancelAdministration}>Batalkan</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <CompleteAdministrationDialog administration={administration} onSave={() => fetchAdministrationDetail(id!)}/>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <Link to={`/kendaraan/detail/${administration.vehicleId}`}>
              <DataBarCard
                variant="button"
                type="kendaraan"
                label={administration.vehicle?.name}
                description={administration.vehicle?.licensePlate}
              />
            </Link>
          </div>

          <div className="flex flex-col gap-5 overflow-auto">
            <SectionCard title="Rincian Administrasi">
              <div className="grid grid-cols-1 gap-3 py-1">
                <div className="grid grid-cols-2 gap-3">
                  <SectionItem label="Jatuh Tempo Baru" value={formatDate(administration.newDueDate)} />
                  <SectionItem label="Biaya" value={administration.totalCost ? `Rp ${formatRupiah(administration.totalCost)}` : undefined} />
                </div>
                <SectionItem label="Catatan" value={administration.notes} />
              </div>
            </SectionCard>
          </div>
        </main>
      </div>
    </>
  );
}
