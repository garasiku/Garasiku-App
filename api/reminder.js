import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TASK_TYPE_LABEL = {
  "servis-regular": "Servis Regular",
  "servis-berat": "Servis Berat",
  "servis-lainnya": "Servis Lainnya",
  "administrasi-stnk-1": "STNK 1 Tahun",
  "administrasi-stnk-5": "STNK 5 Tahun",
  "administrasi-asuransi": "Asuransi",
};

const PENDING = "pending";

// nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

function buildServiceEmail(tasks = []) {
  const formatDate = (dateStr) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));

  const rows = tasks
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

  return `
    <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 8px; background: #ffffff; color: #333;">
      <h2 style="color: #1a1a1a;">🔔 Weekly Reminder Garasiku</h2>
      <h3>🚗 To-do Servis</h3>
      <p style="margin-bottom: 24px;">
        Berikut adalah ringkasan tugas servis yang telah dijadwalkan dalam 30 hari ke depan.
      </p>
      ${
        tasks.length
          ? `<table style="border-collapse: collapse; width: 100%; margin-bottom: 24px;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Nomor Tiket</th>
                  <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Tipe Servis</th>
                  <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Kendaraan</th>
                  <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Jadwal Servis</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>`
          : "<p>Tidak ada to-do servis yang telah dijadwalkan dalam 30 hari ke depan.</p>"
      }
      <p style="font-size: 13px; color: #999; margin-top: 48px;">
        Email ini dikirim secara otomatis oleh sistem Garasiku. Harap tidak membalas email ini.
      </p>
    </div>
  `;
}

function buildAdminEmail(tasks = []) {
  const formatDate = (dateStr) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));

  const rows = tasks
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

  return `
    <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 8px; background: #ffffff; color: #333;">
      <h2 style="color: #1a1a1a;">🔔 Weekly Reminder Garasiku</h2>
      <h3>📄 To-do Administrasi</h3>
      <p style="margin-bottom: 24px;">
        Berikut adalah ringkasan tugas administrasi yang akan jatuh tempo dalam 30 hari ke depan.
      </p>
      ${
        tasks.length
          ? `<table style="border-collapse: collapse; width: 100%; margin-bottom: 24px;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Nomor Tiket</th>
                  <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Tipe Administrasi</th>
                  <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Kendaraan</th>
                  <th style="text-align: left; padding: 8px 12px; background: #f5f5f5;">Jatuh Tempo</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>`
          : "<p>Tidak ada to-do administrasi yang jatuh tempo dalam 30 hari ke depan.</p>"
      }
      <p style="font-size: 13px; color: #999; margin-top: 48px;">
        Email ini dikirim secara otomatis oleh sistem Garasiku. Harap tidak membalas email ini.
      </p>
    </div>
  `;
}

export default async function handler(req, res) {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    const { data: serviceTasks, error: serviceError } = await supabase
      .from("service")
      .select(`
        id,
        ticket_num,
        type,
        schedule_date,
        vehicles ( name, license_plate )
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
        vehicles ( name, license_plate )
      `)
      .eq("status", PENDING)
      .lte("due_date", futureDate.toISOString())
      .order("due_date", { ascending: true });

    if (serviceError || adminError) {
      return res.status(500).json({ message: "Failed to fetch tasks" });
    }

    const sender = `Garasiku Reminder <${process.env.GMAIL_USER}>`;

    // recipients split by comma
    const serviceRecipients = process.env.SERVICE_RECEIVER_EMAIL
      ? process.env.SERVICE_RECEIVER_EMAIL.split(",").map((e) => e.trim())
      : [];
    const adminRecipients = process.env.ADMIN_RECEIVER_EMAIL
      ? process.env.ADMIN_RECEIVER_EMAIL.split(",").map((e) => e.trim())
      : [];

    if (serviceRecipients.length === 0 && adminRecipients.length === 0) {
      return res.status(500).json({ message: "No recipient emails defined" });
    }

    // send service email if recipient exists
    let serviceInfo = null;
    if (serviceRecipients.length > 0) {
      serviceInfo = await transporter.sendMail({
        from: sender,
        to: serviceRecipients,
        subject: "Weekly Service Task Reminder - Garasiku",
        html: buildServiceEmail(serviceTasks ?? []),
      });
      console.log("Service email sent:", serviceInfo.messageId);
    }

    // send admin email if recipient exists
    let adminInfo = null;
    if (adminRecipients.length > 0) {
      adminInfo = await transporter.sendMail({
        from: sender,
        to: adminRecipients,
        subject: "Weekly Administration Task Reminder - Garasiku",
        html: buildAdminEmail(adminTasks ?? []),
      });
      console.log("Administration email sent:", adminInfo.messageId);
    }

    return res.status(200).json({
      message: "Emails sent!",
      serviceTasks: serviceTasks?.length ?? 0,
      adminTasks: adminTasks?.length ?? 0,
    });
  } catch (error) {
    console.error("Send reminder failed:", error);
    return res.status(500).json({ error: "Internal Server Error!" });
  }
}
