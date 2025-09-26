import { ChevronRight } from "lucide-react"
import { SectionCard } from "@/components/shared/section-card"
import SectionItem from "@/components/shared/section-item"
import { DataBarCard } from "@/components/shared/data-bar-card"
import { Button } from "@/components/shadcn/button"
import ServiceActivityItem from "../components/service-activity-item"
import { Separator } from "@/components/shadcn/separator"
import { ImageCarousel } from "../components/image-carousel"
import { EditDetailVehicleDialog } from "../components/edit-detail-vehicle-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/shadcn/alert-dialog"
import { EditDetailStnkDialog } from "../components/edit-detail-stnk-dialog"
import { Vehicle } from "@/models/vehicle"
import { Service } from "@/models/service"
import { EditEquipmentVehicleDialog } from "../components/edit-equipment-vehicle-dialog"
import { Checkbox } from "@/components/shadcn/checkbox"
import AttachmentItem from "@/components/shared/attachment-item"
import { AttachmentVehicle } from "@/models/attachment-vehicle"
import { Administration } from "@/models/administration"
import { Stnk } from "@/models/stnk"
import { Param } from "@/models/param"
import { AddAttachmentVehicleDialog } from "../components/add-attachment-vehicle-dialog"
import AdministrationActivityItem from "../components/administration-activity-item"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { LicensePlateDialog } from "../components/license-plate-dialog"
import { LocationVehicle } from "@/models/location-vehicle"
import { toast } from "sonner"
import { EmptyState } from "@/components/shared/empty-state"
import { PARAM_GROUP_KELENGKAPAN_KENDARAAN } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { LoadingOverlay } from "@/components/shared/loading-overlay"
import { useAuth } from "@/lib/auth-context"
import { SellVehicleDialog } from "../components/sell-vehicle-dialog"

export default function KendaraanDetailPage() {
    const { isOwner, isSecretary, isWSHead, isDriver } = useAuth();

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const { id } = useParams<{ id: string }>();

    const [equipmentParam, setEquipmentParam] = useState<Param[]>([])

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [vehicleStnkDueDate, setVehicleStnkDueDate] = useState<string>();
    const [vehicleInsuranceDueDate, setVehicleInsuranceDueDate] = useState<string>();
    const [vehicleLastServiceDate, setVehicleLastServiceDate] = useState<string>();
    const [vehicleLatestLocation, setVehicleLatestLocation] = useState<LocationVehicle | null>(null);
    const [vehicleStnk, setVehicleStnk] = useState<Stnk | null>(null);
    const [vehicleServices, setVehicleServices] = useState<Service[]>([]);
    const [vehicleAdminitrations, setVehicleAdministrations] = useState<Administration[]>([]);
    const [vehicleEquipments, setVehicleEquipments] = useState<string[]>([]);
    const [vehicleImages, setVehicleImages] = useState<AttachmentVehicle[]>([]);
    const [vehicleAttachments, setVehicleAttachments] = useState<AttachmentVehicle[]>([]);

    const fetchEquipmentParams = async () => {
        const { data, error } = await supabase
            .from("parameter")
            .select("*")
            .eq("group", PARAM_GROUP_KELENGKAPAN_KENDARAAN)
            .order("name")

        if (error) {
            console.error("Equipment params fetch error:", error)
        }

        if (data) {
            setEquipmentParam(data);
        }
    };

    const fetchVehicleFullDetails = async (vehicleId: string) => {
        const { data, error } = await supabase
            .from("vehicle_full_details")
            .select("*")
            .eq("vehicleid", vehicleId)
            .single();

        if (error) {
            console.error("Vehicle full details fetch error:", error);
            return;
        }

        if (data) {
            const base = data;

            setVehicle({
                id: base.vehicleid,
                name: base.name,
                licensePlate: base.license_plate,
                category: base.vehicle_category,
                brand: base.vehicle_brand,
                type: base.vehicle_type,
                color: base.vehicle_color,
                year: base.vehicle_year,
                isSold: base.is_sold,
                soldDate: base.sold_date,
                image: base.image_url,
                stnkDueDate: base.stnk_due_date,
                insuranceDueDate: base.insurance_due_date,
                lastServiceDate: base.last_service_date
            });

            setVehicleStnkDueDate(base.stnk_due_date ?? undefined);
            setVehicleInsuranceDueDate(base.insurance_due_date ?? undefined);
            setVehicleLastServiceDate(base.last_service_date ?? undefined);

            setVehicleLatestLocation({
                id: base.location_id,
                vehicleId: base.vehicleid,
                name: base.location_name,
                address: base.location_address,
            });

            setVehicleStnk({
                id: base.stnk_id,
                vehicleId: base.vehicleid,
                stnkNumber: base.stnk_number,
                fuelType: base.fuel_type,
                licensePlate: base.stnk_license_plate,
                registrationYear: base.registration_year,
                manufacturedYear: base.manufactured_year,
                bpkbNumber: base.bpkb_number,
                cylinderCapacity: base.cylinder_capacity,
                registrationNumber: base.registration_number,
                chassisNumber: base.chassis_number,
                engineNumber: base.engine_number,
                validUntil: base.valid_until,
                brand: base.brand,
                ownerName: base.owner_name,
                ownerAddress: base.owner_address,
                type: base.type,
                category: base.category,
                color: base.color,
                model: base.model,
                licensePlateColor: base.license_plate_color
            });

            setVehicleEquipments(base.equipments ? base.equipments.split("|") : []);
        }
    };

    const fetchVehicleGallery = async (vehicleId: string) => {
        const { data, error } = await supabase
            .from("attachment_vehicle")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .eq("attachment_type", "gallery")
            .order("created_at", { ascending: true })

        if (error) {
            console.error("Vehicle gallery image fetch error:", error)
        }

        if (data) {
            setVehicleImages(data.map(img => ({
                id: img.id,
                vehicleId: img.vehicle_id,
                attachmentType: img.attachment_type,
                fileLink: img.file_link,
            })))
        }
    };

    const fetchVehicleServiceHistory = async (vehicleId: string) => {
        const { data, error } = await supabase
            .from("service")
            .select("id, ticket_num, vehicle_id, type, status, schedule_date, start_date, end_date")
            .eq("vehicle_id", vehicleId)
            .order("schedule_date", { ascending: false })
            .limit(3);

        if (error) {
            console.error("Service history fetch error:", error);
        }

        if (data) {
            setVehicleServices(data.map(svc => ({
                id: svc.id,
                ticketNum: svc.ticket_num,
                vehicleId: svc.vehicle_id,
                type: svc.type,
                status: svc.status,
                scheduleDate: svc.schedule_date,
                startDate: svc.start_date,
                endDate: svc.end_date,
            })));
        }
    };

    const fetchVehicleAdministrationHistory = async (vehicleId: string) => {
        const { data, error } = await supabase
            .from("administration")
            .select("id, ticket_num, vehicle_id, type, status, due_date, end_date")
            .eq("vehicle_id", vehicleId)
            .order("due_date", { ascending: false })
            .limit(3);

        if (error) {
            console.error("Administration history fetch error:", error);
        }

        if (data) {
            setVehicleAdministrations(data.map(adm => ({
                id: adm.id,
                ticketNum: adm.ticket_num,
                vehicleId: adm.vehicle_id,
                type: adm.type,
                status: adm.status,
                dueDate: adm.due_date,
                endDate: adm.end_date,
            })));
        }
    };

    const fetchVehicleAttachments = async (vehicleId: string) => {
        const { data, error } = await supabase
            .from("attachment_vehicle")
            .select("id, vehicle_id, attachment_type, file_name, file_type, file_size, file_link, created_at, created_by")
            .eq("vehicle_id", vehicleId)
            .eq("attachment_type", "document")
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Vehicle attachments fetch error:", error);
        }

        if (data) {
            setVehicleAttachments(data.map(att => ({
                id: att.id,
                vehicleId: att.vehicle_id,
                attachmentType: att.attachment_type,
                fileName: att.file_name,
                fileType: att.file_type,
                fileSize: att.file_size,
                fileLink: att.file_link,
                createdAt: att.created_at,
                createdBy: att.created_by,
            })));
        }
    };

    const fetchVehicleDetails = async (vehicleId: string) => {
        const { data, error } = await supabase
            .from("vehicles")
            .select("*")
            .eq("id", vehicleId)
            .single();

        if (error) {
            console.error("Vehicle details fetch error:", error);
            return;
        }

        if (data) {
            const base = data;

            setVehicle({
                id: base.id,
                name: base.name,
                licensePlate: base.license_plate,
                category: base.category,
                brand: base.brand,
                type: base.type,
                color: base.color,
                year: base.year,
                isSold: base.is_sold,
                soldDate: base.sold_date,
            });
        }
    };

    const fetchVehicleStnk = async (vehicleId: string) => {
        const { data, error } = await supabase
            .from("stnk")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .single();

        if (error) {
            console.error("Vehicle STNK fetch error:", error);
            return;
        }

        if (data) {
            const base = data;

            setVehicleStnk({
                id: base.stnk_id,
                vehicleId: base.vehicleid,
                stnkNumber: base.stnk_number,
                fuelType: base.fuel_type,
                licensePlate: base.license_plate,
                registrationYear: base.registration_year,
                manufacturedYear: base.manufactured_year,
                bpkbNumber: base.bpkb_number,
                cylinderCapacity: base.cylinder_capacity,
                registrationNumber: base.registration_number,
                chassisNumber: base.chassis_number,
                engineNumber: base.engine_number,
                validUntil: base.valid_until,
                brand: base.brand,
                ownerName: base.owner_name,
                ownerAddress: base.owner_address,
                type: base.type,
                category: base.category,
                color: base.color,
                model: base.model,
                licensePlateColor: base.license_plate_color
            });
        }
    };

    const fetchVehicleEquipments = async (vehicleId: string) => {
        const { data, error } = await supabase
            .from("vehicles")
            .select("equipments")
            .eq("id", vehicleId)
            .single();

        if (error) {
            console.error("Vehicle equipments fetch error:", error);
        }

        if (data) {
            setVehicleEquipments(data.equipments.split("|") || []);
        }
    }

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            setLoading(true);

            try {
                await fetchEquipmentParams();
                await fetchVehicleFullDetails(id);

                await Promise.all([
                    fetchVehicleGallery(id),
                    fetchVehicleServiceHistory(id),
                    fetchVehicleAdministrationHistory(id),
                    fetchVehicleAttachments(id)
                ]);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    const handleDeleteVehicle = async () => {
        if (!vehicle?.id) return;
        const vehicleId = vehicle.id;
        setLoading(true);

        try {
            const filePathsToDelete: string[] = [];

            vehicleImages.forEach((item) => {
                if (item.fileLink) filePathsToDelete.push(item.fileLink);
            });

            vehicleAttachments.forEach((item) => {
                if (item.fileLink) filePathsToDelete.push(item.fileLink);
            });

            if (filePathsToDelete.length > 0) {
                const { error: storageError } = await supabase.storage
                    .from("vehicle")
                    .remove(filePathsToDelete);

                if (storageError) throw storageError
            }

            const { error: attachmentVehicleError } = await supabase
                .from("attachment_vehicle")
                .delete()
                .eq("vehicle_id", vehicleId);

            if (attachmentVehicleError) {
                throw new Error("Gagal menghapus attachment vehicles: " + attachmentVehicleError.message);
            }

            const { error: servicesError } = await supabase
                .from("service")
                .delete()
                .eq("vehicle_id", vehicleId);

            if (servicesError) {
                throw new Error("Gagal menghapus service: " + servicesError.message);
            }

            const { error: adminError } = await supabase
                .from("administration")
                .delete()
                .eq("vehicle_id", vehicleId);

            if (adminError) {
                throw new Error("Gagal menghapus administration: " + adminError.message);
            }

            const { error: vehicleError } = await supabase
                .from("vehicles")
                .delete()
                .eq("id", vehicleId);

            if (vehicleError) {
                throw new Error("Gagal menghapus vehicles: " + vehicleError.message);
            }

            toast.success(`Kendaraan "${vehicle.name}" berhasil dihapus.`);
            navigate("/garasi/daftar-kendaraan/active");
        } catch (error) {
            console.error(error);
            toast.error("Gagal menghapus kendaraan: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivateVehicle = async () => {
        if (!vehicle?.id) return;
        const vehicleId = vehicle.id;
        setLoading(true);

        try {
            const isSelling = false;

            const { error } = await supabase
                .from("vehicles")
                .update({
                    is_sold: isSelling,
                    sold_date: null,
                })
                .eq("id", vehicleId);

            if (error) {
                throw new Error("Gagal mengubah status kendaraan: " + error.message);
            }

            toast.success(`Kendaraan "${vehicle.name}" berhasil diubah menjadi aktif.`);
            await fetchVehicleDetails(vehicleId);
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengubah status kendaraan: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handleLicensePlateChange = (newPlate: string) => {
        if (!vehicle) return;

        setVehicle({ ...vehicle, licensePlate: newPlate });
    }

    if (!vehicle && !loading) return (
        <EmptyState title="Kendaraan Tidak Ditemukan" description="Kendaraan dengan ID tersebut tidak tersedia." />
    );

    if (!vehicle) return null;

    return (
        <>
            <LoadingOverlay loading={loading} />

            <div className="min-h-screen flex flex-col">
                {/* Main content */}
                <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 md:max-w-6xl md:mx-auto md:w-full">
                    <div className="flex items-center">
                        <h1 className="text-3xl font-bold">{vehicle.name}</h1>
                    </div>

                    {/* Vehicle Details */}
                    <div className="grid grid-cols-1 rounded-lg border bg-background md:grid-cols-7">

                        {/* Image Carousel */}
                        <div className="col-span-1 md:col-span-4 md:p-5 md:pr-0">
                            {vehicle?.id && (
                                <ImageCarousel images={vehicleImages.map(image => image.fileLink || '')} vehicleId={vehicle.id} onSave={() => fetchVehicleGallery(id!)} />
                            )}
                        </div>

                        <div className="col-span-1 md:col-span-3 w-full flex flex-col justify-start gap-3 p-5">
                            {/* License Plate */}
                            <LicensePlateDialog vehicleId={vehicle.id} currPlateNo={vehicle.licensePlate} onLicensePlateChange={handleLicensePlateChange} />

                            {/* Details */}
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-5 items-center justify-between">
                                    <h1 className="font-semibold">Detail Kendaraan</h1>
                                    {(isOwner || isSecretary) && (
                                        <EditDetailVehicleDialog vehicle={vehicle} onSave={() => fetchVehicleDetails(id!)} />
                                    )}
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-3 py-1">
                                    <SectionItem label="Jenis" value={vehicle.category} />
                                    <SectionItem label="Merk" value={vehicle.brand} />
                                    <SectionItem label="Tipe" value={vehicle.type} />
                                    <SectionItem label="Tahun" value={vehicle.year} />
                                    <SectionItem label="Warna" value={vehicle.color} />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {(isOwner || isSecretary) && (
                                <div className="flex flex-col-reverse gap-3 sm:grid sm:grid-cols-2">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive">Hapus Kendaraan</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Hapus Kendaraan?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Apakah Anda yakin ingin menghapus kendaraan {vehicle.name}?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Tidak</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteVehicle}>Hapus</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    {!vehicle.isSold && (
                                        <SellVehicleDialog vehicle={vehicle} onSave={() => fetchVehicleDetails(id!)}/>
                                    )}

                                    {vehicle.isSold && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="default">Aktifkan Kendaraan</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Aktifkan Kendaraan?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Apakah Anda yakin ingin mengaktifkan kendaraan {vehicle.name} kembali?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Tidak</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleActivateVehicle}>Aktifkan</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Bar */}
                    {(isOwner || isSecretary || isDriver) && (
                        <div className="flex flex-col gap-5">
                            {/* Lokasi Bar */}
                            {(!vehicle.isSold) && (
                                <Link to={`/kendaraan/detail/${vehicle.id}/riwayat-lokasi`}>
                                    <DataBarCard
                                        variant="button"
                                        type="lokasi"
                                        label={vehicleLatestLocation?.name || "Belum ada lokasi"}
                                        description={vehicleLatestLocation?.address || "Belum ada alamat"}
                                    />
                                </Link >
                            )}

                            {/* Terjual Bar */}
                            {(vehicle.isSold && vehicle.soldDate) && (
                                <DataBarCard
                                    variant="default"
                                    type="terjual"
                                    label={"Terjual"}
                                    description={formatDate(vehicle.soldDate)}
                                />
                            )}
                        </div>
                    )}

                    {(isOwner || isSecretary) && (
                        <div className="flex flex-col gap-5 md:flex-row">
                            {/* STNK Bar */}
                            <DataBarCard
                                variant="default"
                                type="administrasi-stnk-1"
                                label="Jatuh Tempo STNK"
                                description={formatDate(vehicleStnkDueDate)}
                            />

                            {/* Asuransi Bar */}
                            <DataBarCard
                                variant="default"
                                type="administrasi-asuransi"
                                label="Jatuh Tempo Asuransi"
                                description={formatDate(vehicleInsuranceDueDate)}
                            />

                            {/* Servis Bar */}
                            <DataBarCard
                                variant="default"
                                type="servis-regular"
                                label="Servis Terakhir"
                                description={formatDate(vehicleLastServiceDate)}
                            />
                        </div>
                    )}

                    {/* STNK Details */}
                    {(isOwner || isSecretary) && (
                        <SectionCard
                            title="Detail STNK"
                            headerAction={
                                vehicleStnk ? <EditDetailStnkDialog stnk={vehicleStnk} onSave={() => fetchVehicleStnk(id!)} /> : null
                            }
                            collapsible
                            defaultCollapsed={true}
                            collapsedHeight={140}
                        >
                            {vehicleStnk && (
                                <div className="flex flex-col gap-3 py-1">
                                    <div className="grid grid-cols-2 gap-3 mb-5 md:mb-0">
                                        <SectionItem label="No Polisi" value={vehicleStnk.licensePlate} />
                                        <SectionItem label="No STNK" value={vehicleStnk.stnkNumber} />
                                        <SectionItem className="col-span-2 md:col-span-1" label="Nama Pemilik" value={vehicleStnk.ownerName} />
                                        <SectionItem className="col-span-2 md:col-span-1" label="Alamat" value={vehicleStnk.ownerAddress} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <SectionItem label="Merk" value={vehicleStnk.brand} />
                                        <SectionItem label="Warna" value={vehicleStnk.color} />
                                        <SectionItem label="Tipe" value={vehicleStnk.type} />
                                        <SectionItem label="Bahan Bakar" value={vehicleStnk.fuelType} />
                                        <SectionItem label="Jenis" value={vehicleStnk.category} />
                                        <SectionItem label="Warna TNKB" value={vehicleStnk.licensePlateColor} />
                                        <SectionItem label="Model" value={vehicleStnk.model} />
                                        <SectionItem label="Tahun Registrasi" value={vehicleStnk.registrationYear} />
                                        <SectionItem label="Tahun Pembuatan" value={vehicleStnk.manufacturedYear} />
                                        <SectionItem label="No BPKB" value={vehicleStnk.bpkbNumber} />
                                        <SectionItem label="Isi Silinder" value={vehicleStnk.cylinderCapacity} />
                                        <SectionItem label="No Pendaftaran" value={vehicleStnk.registrationNumber} />
                                        <SectionItem label="No Rangka" value={vehicleStnk.chassisNumber} />
                                        <SectionItem label="Berlaku Sampai" value={formatDate(vehicleStnk.validUntil)} />
                                        <SectionItem label="No Mesin" value={vehicleStnk.engineNumber} />
                                    </div>
                                </div>
                            )}
                        </SectionCard>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Aktivitas Servis */}
                        {(isOwner || isWSHead) && (
                            <SectionCard
                                title="Aktivitas Servis"
                                headerAction={
                                    <Link to={`/kendaraan/detail/${vehicle.id}/aktivitas-servis`}>
                                        <Button variant="ghost" size="sm">
                                            <ChevronRight />
                                        </Button>
                                    </Link >
                                }
                            >
                                {vehicleServices.length > 0 && (
                                    <div className="flex flex-col py-2">
                                        {
                                            vehicleServices.map((servis, index) => (
                                                <div key={servis.id}>
                                                    <ServiceActivityItem
                                                        service={servis}
                                                    />
                                                    {index < vehicleServices.length - 1 && (
                                                        <Separator className="my-4" />
                                                    )}
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}
                            </SectionCard>
                        )}

                        {/* Aktivitas Administrasi */}
                        {(isOwner || isSecretary) && (
                            <SectionCard
                                title="Aktivitas Administrasi"
                                headerAction={
                                    <Link to={`/kendaraan/detail/${vehicle.id}/aktivitas-administrasi`}>
                                        <Button variant="ghost" size="sm">
                                            <ChevronRight />
                                        </Button>
                                    </Link >
                                }
                            >
                                {vehicleAdminitrations.length > 0 && (
                                    <div className="flex flex-col py-2">
                                        {
                                            vehicleAdminitrations.map((administrasi, index) => (
                                                <div key={administrasi.id}>
                                                    <AdministrationActivityItem
                                                        administrasi={administrasi}
                                                    />
                                                    {index < vehicleAdminitrations.length - 1 && (
                                                        <Separator className="my-4" />
                                                    )}
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}
                            </SectionCard>
                        )}
                    </div>

                    {/* Kelengkapan Kendaraan */}
                    {(isOwner || isSecretary) && (
                        <SectionCard
                            title="Kelengkapan Kendaraan"
                            headerAction={
                                <EditEquipmentVehicleDialog
                                    vehicleId={id}
                                    equipmentParam={equipmentParam}
                                    vehicleEquipments={vehicleEquipments}
                                    onSave={() => fetchVehicleEquipments(id!)}
                                />

                            }
                        >
                            {equipmentParam.length > 0 && (
                                <div className={`grid gap-5 p-2 ${equipmentParam.length > 5 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                                    {equipmentParam.map((item) => (
                                        <div key={item.id} className="flex flex-row items-center space-x-3 space-y-0">
                                            <Checkbox checked={vehicleEquipments.includes(item.name)} disabled />
                                            <label className="text-sm font-normal">
                                                {item.description}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    )}

                    {/* Lampiran Dokumen */}
                    {(isOwner || isSecretary) && (
                        <SectionCard
                            title="Lampiran Dokumen"
                            headerAction={
                                <AddAttachmentVehicleDialog vehicleId={vehicle.id} onSave={() => fetchVehicleAttachments(id!)} />
                            }
                        >
                            {vehicleAttachments.length > 0 && (
                                <div className="flex flex-col">
                                    {
                                        vehicleAttachments.map((attachment, index) => (
                                            <div key={attachment.id}>
                                                <AttachmentItem
                                                    attachment={attachment}
                                                    type="vehicle"
                                                    onAttachmentDelete={() => fetchVehicleAttachments(id!)}
                                                    setLoading={setLoading}
                                                />
                                                {index < vehicleAttachments.length - 1 && (
                                                    <Separator className="my-4" />
                                                )}
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </SectionCard>
                    )}
                </main >
            </div >
        </>
    )
}
