/**
 * Email Notification Test Script
 * Verifies sending Welcome Email and Task Update Email using configured Gmail credentials
 */
require("dotenv").config();
const { sendWelcomeEmail, sendTaskUpdateEmail } = require("../src/services/emailService");

async function testEmail() {
  console.log("\n=======================================================");
  console.log("       TESTING EMAIL NOTIFICATION SERVICE              ");
  console.log("=======================================================\n");

  const testUser = {
    name: "Smit Sureja",
    email: process.env.EMAIL_USER || "smitsureja472007@gmail.com",
  };

  const testTask = {
    id: "67df8c101234567890abcdef",
    title: "Test Email Notification Implementation",
    completed: true,
    updatedAt: new Date(),
  };

  console.log(`📧 Sending Welcome Email to ${testUser.email}...`);
  const welcomeResult = await sendWelcomeEmail(testUser);
  if (welcomeResult && welcomeResult.messageId) {
    console.log(`✅ Welcome email dispatched successfully! [ID: ${welcomeResult.messageId}]`);
  } else {
    console.error("❌ Welcome email failed to send.");
  }

  console.log(`\n📧 Sending Task Update Email to ${testUser.email}...`);
  const updateResult = await sendTaskUpdateEmail(testUser, testTask);
  if (updateResult && updateResult.messageId) {
    console.log(`✅ Task update email dispatched successfully! [ID: ${updateResult.messageId}]`);
  } else {
    console.error("❌ Task update email failed to send.");
  }

  console.log("\n=======================================================");
  console.log("EMAIL NOTIFICATION TEST COMPLETE");
  console.log("=======================================================\n");
  process.exit(welcomeResult && updateResult ? 0 : 1);
}

testEmail();
