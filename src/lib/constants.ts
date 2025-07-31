import { Anvil, Bolt, CarFront, IdCard, MapPin, ShieldCheck, Tag, Wrench, type LucideIcon } from "lucide-react";

export const TASK_TYPE_LABEL: Record<string, string> = {
  "servis-regular": "Servis Regular",
  "servis-berat": "Servis Berat",
  "servis-lainnya": "Servis Lainnya",
  "administrasi-stnk-1": "STNK 1 Tahun",
  "administrasi-stnk-5": "STNK 5 Tahun",
  "administrasi-asuransi": "Asuransi"
};

export const TASK_TYPE_ICONS: Record<string, LucideIcon> = {
  "administrasi-stnk-1": IdCard,
  "administrasi-stnk-5": IdCard,
  "administrasi-asuransi": ShieldCheck,
  "servis-regular": Wrench,
  "servis-berat": Anvil,
  "servis-lainnya": Bolt,
  "lokasi": MapPin,
  "terjual": Tag,
  "kendaraan": CarFront,
};

export const PENDING = "pending";
export const ONGOING = "ongoing";
export const COMPLETED = "completed";
export const CANCELLED = "cancelled";
export const ACTIVE = "active";
export const INACTIVE = "inactive";

export type Status = typeof PENDING | typeof ONGOING | typeof COMPLETED | typeof CANCELLED | typeof ACTIVE | typeof INACTIVE;

export const STATUS_LABEL: Record<Status, string> = {
  [PENDING]: "Pending",
  [ONGOING]: "Proses",
  [COMPLETED]: "Selesai",
  [CANCELLED]: "Dibatalkan",
  [ACTIVE]: "Aktif",
  [INACTIVE]: "Nonaktif"
};

export const VEHICLE_CATEGORY_PARAM = [
  { id: "1", group: "0001", name: "Mobil", description: "Mobil" },
  { id: "2", group: "0001", name: "Motor", description: "Motor" },
]

export const SERVICE_TYPE_PARAM = [
  { id: "1", group: "0002", name: "servis-regular", description: TASK_TYPE_LABEL["servis-regular"] },
  { id: "2", group: "0002", name: "servis-berat", description: TASK_TYPE_LABEL["servis-berat"] },
  { id: "3", group: "0002", name: "servis-lainnya", description: TASK_TYPE_LABEL["servis-lainnya"] },
]

export const ADMINISTRATION_TYPE_PARAM = [
  { id: "1", group: "0003", name: "administrasi-stnk-1", description: TASK_TYPE_LABEL["administrasi-stnk-1"] },
  { id: "2", group: "0003", name: "administrasi-stnk-5", description: TASK_TYPE_LABEL["administrasi-stnk-5"] },
  { id: "3", group: "0003", name: "administrasi-asuransi", description: TASK_TYPE_LABEL["administrasi-asuransi"] },
]

export const STATUS_PARAM = [
  { id: "1", group: "0004", name: "pending", description: STATUS_LABEL["pending"] },
  { id: "2", group: "0004", name: "ongoing", description: STATUS_LABEL["ongoing"] },
  { id: "3", group: "0004", name: "completed", description: STATUS_LABEL["completed"] },
  { id: "4", group: "0004", name: "cancelled", description: STATUS_LABEL["cancelled"] },
]

export const ROLE_PARAM = [
  { id: "1", group: "0005", name: "owner", description: "Owner" },
  { id: "2", group: "0005", name: "divisi", description: "Divisi" },
  { id: "3", group: "0005", name: "wshead", description: "WS-Head" },
  { id: "4", group: "0005", name: "driver", description: "Driver" },
  { id: "5", group: "0005", name: "admin", description: "Admin" },
]

export const MAX_FILE_SIZE = 1 * 1024 * 1024; //1 MB

export const OWNER = "owner";
export const DIVISI = "divisi";
export const WSHEAD = "wshead";
export const DRIVER = "driver";
export const ADMIN = "admin";

// PARAMETER GROUP
export const PARAM_GROUP_MERK_KENDARAAN = '1001';
export const PARAM_GROUP_LOKASI_KENDARAAN = '1002';
export const PARAM_GROUP_WAKTU_REMINDER = '1003';
export const PARAM_GROUP_KELENGKAPAN_KENDARAAN = '1004';


// PARAMETER NAME
export const PARAM_WAKTU_REMINDER = 'waktu-reminder'