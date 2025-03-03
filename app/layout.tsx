export const runtime = 'edge';

import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {Providers} from "@/app/providers";
import {cookieToInitialState} from "wagmi";
import {getConfig} from "@/wagmi.config";
import {headers} from "next/headers";
import React from "react";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "nextjs dapp demo",
    description: "nextjs dapp demo",
};

export default async function RootLayout({children,}: Readonly<{
    children: React.ReactNode;
}>) {
    const initialState = cookieToInitialState(
        getConfig(),
        (await headers()).get("cookie") ?? ""
    );
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-6 text-white">
            <Providers initialState={initialState}>
                <main className="container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </main>
            </Providers>
        </div>
        </body>
        </html>
    );
}
