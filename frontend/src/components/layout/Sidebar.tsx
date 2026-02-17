"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShieldAlert,
    FileKey,
    Users,
    LogOut,
    Menu,
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
    {
        name: "Dashboard",
        href: "/employee",
        icon: LayoutDashboard,
        role: "employee",
    },
    {
        name: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        role: "admin",
    },
    {
        name: "Dashboard",
        href: "/auditor",
        icon: LayoutDashboard,
        role: "auditor",
    },
    {
        name: "Vault Items",
        href: "/employee/vault", // Example, though currently all on one page
        icon: FileKey,
        role: "employee",
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        setRole(localStorage.getItem("role"));
    }, []);

    // Simple mapping for now, assuming single-page dashboards mostly
    // In a real app we'd have more granular nav
    const getNav = () => {
        if (!role) return [];
        if (role === "employee") {
            return [{ name: "Overview", href: "/employee", icon: LayoutDashboard }];
        }
        if (role === "admin") {
            return [
                { name: "Overview", href: "/admin", icon: LayoutDashboard },
                // Add more if pages split
            ];
        }
        if (role === "auditor") {
            return [{ name: "Audit Logs", href: "/auditor", icon: ShieldAlert }];
        }
        return [];
    };

    const links = getNav();

    return (
        <div className="flex h-full w-64 flex-col bg-secondary text-secondary-foreground">
            <div className="flex h-16 items-center px-6">
                <ShieldAlert className="h-6 w-6 text-primary mr-2" />
                <span className="text-lg font-bold tracking-tight">ENTITLED</span>
            </div>
            <div className="flex-1 px-4 py-4 space-y-2">
                {links.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10",
                                isActive ? "bg-white/10 text-white" : "text-gray-400"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </div>
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = "/";
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-white/5 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Logout
                </button>
            </div>
        </div>
    );
}
