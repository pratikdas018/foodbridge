import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface SendNewUserEmailBody {
  name?: string;
  email?: string;
  role?: string;
  signupTime?: string;
}

function formatSignupTime(value?: string): string {
  const now = new Date();

  if (!value) {
    return formatReadableDate(now);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return formatReadableDate(now);
  }

  return formatReadableDate(parsed);
}

function formatReadableDate(date: Date): string {
  const base = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return base.replace(/\b(am|pm)\b/i, (match) => match.toUpperCase());
}

function formatRoleLabel(role: string): string {
  const normalized = role.trim().toLowerCase();

  if (normalized === "ngo") {
    return "NGO";
  }

  if (normalized === "restaurant") {
    return "Restaurant";
  }

  if (normalized === "admin") {
    return "Admin";
  }

  return role.trim();
}

export async function POST(request: Request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!adminEmail || !emailUser || !emailPass) {
      return NextResponse.json(
        { message: "Email environment variables are not configured." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as SendNewUserEmailBody;
    const name = body.name?.trim();
    const email = body.email?.trim();
    const role = body.role?.trim();

    if (!name || !email || !role) {
      return NextResponse.json(
        { message: "name, email and role are required." },
        { status: 400 },
      );
    }

    const registeredAt = formatSignupTime(body.signupTime);
    const roleLabel = formatRoleLabel(role);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const subject = "New User Registered on FoodBridge";
    const textBody = [
      "New user has registered on FoodBridge:",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Role: ${roleLabel}`,
      `Registered At: ${registeredAt}`,
    ].join("\n");

    await transporter.sendMail({
      from: `FoodBridge Alerts <${emailUser}>`,
      to: adminEmail,
      subject,
      text: textBody,
    });

    return NextResponse.json({ message: "Admin email sent." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send admin email.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
