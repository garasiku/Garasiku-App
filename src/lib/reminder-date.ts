import { supabase } from "./supabaseClient";
import { PARAM_GROUP_WAKTU_REMINDER, PARAM_WAKTU_REMINDER } from "./constants";

let cachedReminderRange:
  | { today: Date; futureDate: Date; intervalDays: number }
  | null = null;

export async function getCachedReminderDateRange() {
  if (cachedReminderRange) return cachedReminderRange;

  const today = new Date();
  let days = 30;

  try {
    const { data, error } = await supabase
      .from("parameter")
      .select("description")
      .eq("group", PARAM_GROUP_WAKTU_REMINDER)
      .eq("name", PARAM_WAKTU_REMINDER)
      .single();

    if (error) {
      console.warn("Supabase error:", error.message);
    } else {
      const intervalDays = Number(data?.description);
      if (!isNaN(intervalDays) && intervalDays > 0) {
        days = intervalDays;
      }
    }
  } catch (error) {
    console.error("Unexpected failure fetching reminder interval param:", error);
  }

  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  cachedReminderRange = { today, futureDate, intervalDays: days };
  return cachedReminderRange;
}

export function clearReminderCache() {
  cachedReminderRange = null;
}
