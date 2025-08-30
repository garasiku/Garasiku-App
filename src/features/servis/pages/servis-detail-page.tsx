import { useEffect, useState } from "react";
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
import { Service } from "@/models/service";
import AttachmentItem from "@/components/shared/attachment-item";
import { AttachmentService } from "@/models/attachment-service";
import TaskTypeBar from "@/components/shared/task-type-bar";
import StatusBar from "@/components/shared/status-bar";
import { CANCELLED, ONGOING, PENDING, Status } from "@/lib/constants";
import { EditServiceRecordDialog } from "../components/edit-service-record-dialog";
import { AddAttachmentServiceDialog } from "../components/add-attachment-service-dialog";
import { StartServiceDialog } from "../components/start-service-dialog";
import { CompleteServiceDialog } from "../components/complete-service-dialog";
import { DataBarCard } from "@/components/shared/data-bar-card";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient"
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatNumber, formatRupiah } from "@/lib/utils";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export default function ServisDetailPage() {
    const { isOwner, isDivisi } = useAuth();

    const [loading, setLoading] = useState(false);

    const { id } = useParams<{ id: string }>();
    const [service, setService] = useState<Service | null>(null);
    const [serviceAttachments, setServiceAttachments] = useState<AttachmentService[]>([]);
    const [latestLocation, setLatestLocation] = useState<{ id: string; vehicleId: string; name: string; address: string } | null>(null);

    const fetchServiceDetail = async (serviceId: string): Promise<string | null> => {
        const { data, error } = await supabase
            .from("service")
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
            .eq("id", serviceId)
            .single();

        if (error) {
            console.error("Service detail fetch error:", error)
        }

        if (data) {
            setService({
                id: data.id,
                ticketNum: data.ticket_num,
                vehicleId: data.vehicle_id,
                vehicle: {
                    id: data.vehicles.id,
                    name: data.vehicles.name,
                    category: data.vehicles.category,
                    year: data.vehicles.year,
                    brand: data.vehicles.brand,
                    color: data.vehicles.color,
                    type: data.vehicles.type,
                    licensePlate: data.vehicles.license_plate,
                },
                type: data.type,
                scheduleDate: data.schedule_date,
                startDate: data.start_date,
                endDate: data.end_date,
                status: data.status as Status,
                mileage: data.mileage,
                totalCost: data.total_cost,
                mechanicName: data.mechanic_name,
                task: data.task,
                sparepart: data.sparepart,
                material: data.material,
                notes: data.notes,
            });

            return data.vehicle_id;
        }

        return null;
    };

    const fetchLatestVehicleLocation = async (vehicleId: string) => {
        const { data, error } = await supabase
            .from("vehicle_locations")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("created_at", { ascending: false })
            .limit(1);

        if (error) {
            console.error("Latest vehicle location fetch error:", error);
        }

        if (data && data.length > 0) {
            const latest = data[0];
            setLatestLocation({
                id: latest.id,
                vehicleId: latest.vehicle_id,
                name: latest.name,
                address: latest.address,
            });
        } else {
            setLatestLocation(null); // fallback kalau tidak ada lokasi
        }
    };

    const fetchServiceAttachments = async (serviceId: string) => {
        const { data, error } = await supabase
            .from("attachment_service")
            .select("id, service_id, file_name, file_type, file_size, file_link, created_at, created_by")
            .eq("service_id", serviceId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Service attachments fetch error:", error);
        }

        if (data) {
            setServiceAttachments(data.map(att => ({
                id: att.id,
                serviceId: att.service_id,
                fileName: att.file_name,
                fileType: att.file_type,
                fileSize: att.file_size,
                fileLink: att.file_link,
                createdAt: att.created_at,
                createdBy: att.created_by,
            })));
        }
    };

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            setLoading(true);

            try {
                const vehicleId = await fetchServiceDetail(id);

                if (vehicleId) {
                    await fetchLatestVehicleLocation(vehicleId);
                }

                await fetchServiceAttachments(id);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    const handleCancelService = async () => {
        if (!service) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from("service")
                .update({ status: CANCELLED })
                .eq("id", service.id);

            if (error) {
                toast.error("Gagal mengupdate service " + error.message);
            }

            toast.success("Berhasil membatalkan administrasi.");
            await fetchServiceDetail(service.id!);
        } catch (error) {
            console.error(error);
            toast.error("Gagal membatalkan servis: " + error);
        } finally {
            setLoading(false);
        }
    };

    if (!service && !loading) return (
        <EmptyState title="Servis Tidak Ditemukan" description="Servis dengan ID tersebut tidak tersedia." />
    );

    if (!service) return null;

    return (
        <>
            <LoadingOverlay loading={loading} />

            <div className="min-h-screen flex flex-col">
                {/* Main content */}
                <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 md:max-w-6xl md:mx-auto md:w-full">
                    <div className="flex flex-col gap-5">
                        {/* Service Details */}
                        <div className="flex flex-col gap-3 rounded-lg border bg-background p-5">
                            <div>
                                <h1 className="text-3xl font-bold">{service.ticketNum}</h1>
                            </div>

                            <Separator />

                            <div className="flex flex-col gap-5">
                                <div className="flex flex-col gap-5">
                                    <div className="flex items-start justify-between">
                                        <TaskTypeBar taskType={service.type} />
                                        <StatusBar status={service.status as Status} />
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <SectionItem label="Jadwal Servis" value={formatDate(service.scheduleDate)} />
                                        <SectionItem label="Servis Mulai" value={formatDate(service.startDate)} />
                                        <SectionItem label="Servis Selesai" value={formatDate(service.endDate)} />
                                    </div>
                                </div>

                                <div className="flex flex-col-reverse gap-3 sm:grid sm:grid-cols-2">
                                    {(service.status == PENDING || service.status == ONGOING) && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive">Batalkan Servis</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Batalkan Servis?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Apakah Anda yakin ingin membatalkan servis {service.ticketNum}?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Tidak</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleCancelService}>Batalkan</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}

                                    {service.status == PENDING && (
                                        <StartServiceDialog service={service} onSave={() => fetchServiceDetail(id!)} />
                                    )}

                                    {service.status == ONGOING && (
                                        <CompleteServiceDialog service={service} onSave={() => fetchServiceDetail(id!)} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Bar */}
                    <div className="flex flex-col gap-5">
                        {/* Vehicle Bar */}
                        <Link to={`/kendaraan/detail/${service.vehicleId}`}>
                            <DataBarCard
                                variant="button"
                                type="kendaraan"
                                label={service.vehicle?.name}
                                description={service.vehicle?.licensePlate}
                            />
                        </Link >

                        {/* Lokasi Bar */}
                        {(isOwner || isDivisi) && latestLocation && (
                            <Link to={`/kendaraan/detail/${service.vehicleId}/riwayat-lokasi`}>
                                <DataBarCard
                                    variant="button"
                                    type="lokasi"
                                    label={latestLocation.name}
                                    description={latestLocation.address}
                                />
                            </Link >
                        )}
                    </div>


                    {/* Rincian Servis */}
                    <SectionCard
                        title="Rincian Servis"
                        headerAction={
                            <>
                                {service.status == ONGOING && (
                                    <EditServiceRecordDialog service={service} onSave={() => fetchServiceDetail(id!)} />
                                )}
                            </>
                        }
                    >
                        {service && (
                            <div className="grid grid-cols-1 gap-3 py-1">
                                <div className="grid grid-cols-2 gap-3">
                                    <SectionItem label="Kilometer" value={service.mileage ? `${formatNumber(service.mileage)} KM` : undefined} />
                                    <SectionItem label="Biaya" value={service.totalCost ? `Rp ${formatRupiah(service.totalCost)}` : undefined} />
                                </div>
                                <SectionItem label="Nama Mekanik" value={service.mechanicName} />
                                <SectionItem label="Jasa" value={service.task} />
                                <SectionItem label="Sparepart" value={service.sparepart} />
                                <SectionItem label="Bahan" value={service.material} />
                                <SectionItem label="Catatan" value={service.notes} />
                            </div>
                        )}
                    </SectionCard>

                    {/* Lampiran Dokumen */}
                    {(isOwner || isDivisi) && (
                        <SectionCard
                            title="Lampiran Dokumen"
                            headerAction={
                                <AddAttachmentServiceDialog serviceId={service.id} onSave={() => fetchServiceAttachments(id!)} />
                            }
                        >
                            {serviceAttachments.length > 0 && (
                                <div className="flex flex-col">
                                    {
                                        serviceAttachments.map((attachment, index) => (
                                            <div key={attachment.id}>
                                                <AttachmentItem
                                                    attachment={attachment}
                                                    type="service"
                                                    onAttachmentDelete={() => fetchServiceAttachments(id!)}
                                                    setLoading={setLoading}
                                                />
                                                {index < serviceAttachments.length - 1 && (
                                                    <Separator className="my-4" />
                                                )}
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </SectionCard>
                    )}
                </main>
            </div>
        </>
    )
}
