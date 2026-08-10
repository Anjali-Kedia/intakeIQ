import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntakeIQ | Device Intake Assistant",
  description: "A guided intake and pricing assistant for second-hand electronics stores."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
