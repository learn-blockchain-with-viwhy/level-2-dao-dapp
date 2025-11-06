import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { MetaMaskConnect } from '@/components/MetaMaskConnect';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'DAO Voting DApp',
    description: 'Decentralized Autonomous Organization Voting Application',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <Providers>
                    <div className="min-h-screen bg-zinc-50 dark:bg-black">
                        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:bg-black/80 dark:border-gray-800">
                            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                    DAO Voting
                                </h1>
                                <MetaMaskConnect />
                            </div>
                        </header>
                        <main>{children}</main>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
