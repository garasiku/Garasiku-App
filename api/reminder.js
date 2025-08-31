import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const TASK_TYPE_LABEL = {
  "servis-regular": "Servis Regular",
  "servis-berat": "Servis Berat",
  "servis-lainnya": "Servis Lainnya",
  "administrasi-stnk-1": "STNK 1 Tahun",
  "administrasi-stnk-5": "STNK 5 Tahun",
  "administrasi-asuransi": "Asuransi",
};

const PENDING = "pending";

function buildReminderEmail(serviceTasks = [], adminTasks = []) {
  const formatDate = (dateStr) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));

  const formatServiceTasks = (tasks) =>
    tasks
      .map(
        (task) => `
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${task.ticket_num}</td>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${TASK_TYPE_LABEL[task.type] || task.type}</td>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${task.vehicles.name} - ${task.vehicles.license_plate}</td>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${formatDate(task.schedule_date)}</td>
        </tr>`
      )
      .join("");

  const formatAdminTasks = (tasks) =>
    tasks
      .map(
        (task) => `
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${task.ticket_num}</td>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${TASK_TYPE_LABEL[task.type] || task.type}</td>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${task.vehicles.name} - ${task.vehicles.license_plate}</td>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${formatDate(task.due_date)}</td>
        </tr>`
      )
      .join("");

  const serviceHTML = serviceTasks.length
    ? `
      <h3 style="margin-bottom: 4px;">🚗 To-do Servis</h3>
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 24px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Nomor Tiket</th>
            <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Tipe Servis</th>
            <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Kendaraan</th>
            <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Jadwal Servis</th>
          </tr>
        </thead>
        <tbody>${formatServiceTasks(serviceTasks)}</tbody>
      </table>
    `
    : `
      <h3 style="margin-bottom: 4px;">🚗 To-do Servis</h3>
      <p>Tidak ada to-do servis yang jatuh tempo dalam 30 hari ke depan.</p>
      `
    ;

  const adminHTML = adminTasks.length
    ? `
      <h3 style="margin-bottom: 4px;">📄 To-do Administrasi</h3>
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 24px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Nomor Tiket</th>
            <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Tipe Administrasi</th>
            <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Kendaraan</th>
            <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Jatuh Tempo</th>
          </tr>
        </thead>
        <tbody>${formatAdminTasks(adminTasks)}</tbody>
      </table>
    `
    : `
      <h3 style="margin-bottom: 4px;">📄 To-do Administrasi</h3>
      <p>Tidak ada to-do administrasi yang jatuh tempo dalam 30 hari ke depan.</p>
      `
    ;

  return `
    <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 16px; background: #ffffff; color: #333;">
      <h2 style="color: #1a1a1a;">🔔 Weekly Reminder Garasiku</h2>
      <p style="margin-bottom: 24px;">
        Berikut adalah ringkasan tugas servis dan administrasi yang akan jatuh tempo dalam 30 hari ke depan.
      </p>
      ${serviceHTML}
      ${adminHTML}
      <p style="font-size: 13px; color: #999; margin-top: 48px;">
        Email ini dikirim secara otomatis oleh sistem Garasiku. Harap tidak membalas email ini.
      </p>
    </div>
  `;
}

// Vercel serverless function export
export default async function handler(req, res) {
  try {
    const today = new Date();
    let days = 30;
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const { data: serviceTasks, error: serviceError } = await supabase
      .from("service")
      .select(`
        id,
        ticket_num,
        type,
        schedule_date,
        vehicles (
          name,
          license_plate
        )
      `)
      .eq("status", PENDING)
      .lte("schedule_date", futureDate.toISOString())
      .order("schedule_date", { ascending: true });

    const { data: adminTasks, error: adminError } = await supabase
      .from("administration")
      .select(`
        id,
        ticket_num,
        type,
        due_date,
        vehicles (
          name,
          license_plate
        )
      `)
      .eq("status", PENDING)
      .lte("due_date", futureDate.toISOString())
      .order("due_date", { ascending: true });

    if (serviceError || adminError) {
      return res.status(500).json({ message: "Failed to fetch tasks" });
    }

    const html = buildReminderEmail(serviceTasks ?? [], adminTasks ?? []);

    const recipients = process.env.REMINDER_RECEIVER_EMAIL
      ? process.env.REMINDER_RECEIVER_EMAIL.split(",").map((e) => e.trim())
      : [];

    if (recipients.length === 0) {
      return res.status(500).json({ message: "No recipient email defined" });
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: recipients,
      subject: "Weekly Task Reminder - Garasiku",
      html: html,
    });

    return res.status(200).json({ message: "Reminder email sent!" });
  } catch (error) {
    console.error("Send reminder failed:", error);
    return res.status(500).json({ error: "Internal Server Error!" });
  }
}
