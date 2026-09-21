const nodemailer = require("nodemailer");

/**
 * Create Nodemailer Transporter
 */
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  // Use Gmail SMTP with App Password
  if (user && pass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback to OAuth2 if configured
  if (user && process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.REFRESH_TOKEN) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
      },
    });
  }

  return null;
};

/**
 * Send Welcome Email on User Registration
 * @param {Object} user - { name, email }
 */
const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.warn("⚠️ Email transporter not configured. Skipping welcome email.");
      return;
    }

    const mailOptions = {
      from: `"Task Management" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Welcome to Task Manager, ${user.name}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #333333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 35px 20px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 700; }
            .content { padding: 30px; line-height: 1.6; }
            .content h2 { color: #1e1e2f; font-size: 20px; margin-top: 0; }
            .badge { display: inline-block; background: #ede9fe; color: #7c3aed; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 15px; }
            .features { background: #fafafa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
            .features ul { margin: 0; padding-left: 20px; }
            .features li { margin-bottom: 8px; }
            .footer { background: #f9f9fb; padding: 20px; text-align: center; font-size: 13px; color: #888888; border-top: 1px solid #eeeeee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚡ Task Manager</h1>
            </div>
            <div class="content">
              <span class="badge">Account Created Successfully</span>
              <h2>Hello ${user.name},</h2>
              <p>Welcome to <strong>Task Manager</strong>! Your account has been registered successfully with email: <strong>${user.email}</strong>.</p>
              
              <div class="features">
                <strong>What you can do:</strong>
                <ul>
                  <li>📋 Create and organize private tasks with high-speed MongoDB Atlas backend</li>
                  <li>✅ Mark tasks completed or active with instant real-time sync</li>
                  <li>🔒 Rest assured all tasks are encrypted and isolated strictly to your account</li>
                </ul>
              </div>

              <p>You can now sign in anytime from your dashboard and start managing your tasks securely.</p>
              <p>Best regards,<br><strong>The Task Manager Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Task Management Application. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Welcome email sent to ${user.email} [MessageID: ${info.messageId}]`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${user.email}:`, error.message);
  }
};

/**
 * Send Task Update Email Notification
 * @param {Object} user - { name, email }
 * @param {Object} task - { id, title, completed, updatedAt }
 */
const sendTaskUpdateEmail = async (user, task) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.warn("⚠️ Email transporter not configured. Skipping task update email.");
      return;
    }

    const statusText = task.completed ? "Completed ✅" : "In Progress / Active ⏳";
    const statusColor = task.completed ? "#10b981" : "#f59e0b";

    const mailOptions = {
      from: `"Task Management" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Task Updated: "${task.title}" 📋`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #333333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px 20px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .content { padding: 30px; line-height: 1.6; }
            .task-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .task-title { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 10px; }
            .task-status { display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 13px; font-weight: 600; color: #ffffff; background-color: ${statusColor}; }
            .task-time { font-size: 13px; color: #64748b; margin-top: 10px; }
            .footer { background: #f9f9fb; padding: 20px; text-align: center; font-size: 13px; color: #888888; border-top: 1px solid #eeeeee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Task Update Notification</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${user.name || "User"}</strong>,</p>
              <p>One of your tasks was recently updated in your account:</p>
              
              <div class="task-card">
                <div class="task-title">${task.title}</div>
                <div>Status: <span class="task-status">${statusText}</span></div>
                <div class="task-time">Updated at: ${new Date().toLocaleString()}</div>
              </div>

              <p>If you did not make this change, please sign in to your dashboard to review your account activity.</p>
              <p>Best regards,<br><strong>The Task Manager Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Task Management Application. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Task update email sent to ${user.email} for task "${task.title}" [MessageID: ${info.messageId}]`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send task update email to ${user.email}:`, error.message);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendTaskUpdateEmail,
};
