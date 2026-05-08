import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

// Status badge styles
const STATUS_STYLES = {
  VERIFIED:         { bg: "#d1fae5", color: "#065f46", label: "✅ VERIFIED" },
  SUSPICIOUS:       { bg: "#fef9c3", color: "#713f12", label: "⚠️ SUSPICIOUS" },
  OUTSIDE_GEOFENCE: { bg: "#fee2e2", color: "#7f1d1d", label: "❌ OUTSIDE GEOFENCE" },
};

export default class Mailer {
  // ── Generic plain-text / HTML mailer ──────────────────────────────
  static async sendMail(to, subject, text, html = null) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: `"PresencePlus" <${process.env.EMAIL}>`,
      to,
      subject,
      text,
      ...(html && { html }),
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error("Mailer error:", error);
      return false;
    }
  }

  // ── Attendance confirmation email ─────────────────────────────────
  static async sendAttendanceConfirmation({
    studentEmail,
    studentRegno,
    sessionName,
    sessionDate,
    sessionTime,
    teacherEmail,
    status,
    distance,
  }) {
    const style = STATUS_STYLES[status] || STATUS_STYLES["SUSPICIOUS"];
    const formattedDate = sessionDate
      ? new Date(sessionDate).toLocaleDateString("en-IN", {
          day: "numeric", month: "long", year: "numeric",
        })
      : "N/A";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Attendance Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">✅ Attendance Confirmed</h1>
            <p style="margin:6px 0 0;color:#e0e7ff;font-size:14px;">PresencePlus Attendance System</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 24px;color:#374151;font-size:15px;">
              Hi <strong>${studentRegno || studentEmail}</strong>, your attendance has been successfully recorded for the following session:
            </p>

            <!-- Session details card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="6">
                    <tr>
                      <td style="color:#6b7280;font-size:13px;width:40%;">Session</td>
                      <td style="color:#111827;font-size:14px;font-weight:600;">${sessionName}</td>
                    </tr>
                    <tr><td colspan="2" style="padding:4px 0;border-bottom:1px solid #e5e7eb;"></td></tr>
                    <tr>
                      <td style="color:#6b7280;font-size:13px;padding-top:8px;">Date</td>
                      <td style="color:#111827;font-size:14px;padding-top:8px;">${formattedDate}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:13px;padding-top:6px;">Time</td>
                      <td style="color:#111827;font-size:14px;padding-top:6px;">${sessionTime}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:13px;padding-top:6px;">Distance</td>
                      <td style="color:#111827;font-size:14px;padding-top:6px;">${distance} m from teacher</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:13px;padding-top:6px;">Teacher</td>
                      <td style="color:#111827;font-size:14px;padding-top:6px;">${teacherEmail}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:13px;padding-top:8px;">Status</td>
                      <td style="padding-top:8px;">
                        <span style="background:${style.bg};color:${style.color};font-size:12px;font-weight:700;padding:4px 10px;border-radius:4px;letter-spacing:0.5px;">
                          ${style.label}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              If you did not mark this attendance or believe this is an error, please contact your teacher immediately.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              This is an automated message from <strong>PresencePlus</strong>. Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim();

    const text = `Attendance Confirmed\n\nHi ${studentRegno || studentEmail},\n\nYour attendance has been recorded.\n\nSession: ${sessionName}\nDate: ${formattedDate}\nTime: ${sessionTime}\nDistance: ${distance}m\nTeacher: ${teacherEmail}\nStatus: ${status}\n\n— PresencePlus`;

    return Mailer.sendMail(
      studentEmail,
      `✅ Attendance Confirmed — ${sessionName}`,
      text,
      html
    );
  }
}

