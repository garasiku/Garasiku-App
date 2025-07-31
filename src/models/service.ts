import { LocationVehicle } from "./location-vehicle"
import { Vehicle } from "./vehicle"

export interface Service{
    id?: string;
    ticketNum?: string;
    vehicleId?: string;
    vehicle?: Vehicle;
    type?: string;
    scheduleDate?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    location?: LocationVehicle;
    mileage?: number;
    totalCost?: number;
    mechanicName?: string;
    task?: string;
    sparepart?: string;
    notes?: string;
}