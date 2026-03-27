import type { Metadata } from "next";
import "./globals.css";
import PrivyProviderWrapper from "./providers";

export const metadata: Metadata = {
  title: "StarkSplit",
  description: "Split expenses, settle on-chain with StarkZap",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PrivyProviderWrapper>{children}</PrivyProviderWrapper>
      </body>
    </html>
  );
}