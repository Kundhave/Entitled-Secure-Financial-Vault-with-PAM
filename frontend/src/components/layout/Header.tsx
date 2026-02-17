"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";

export function Header() {
    const [username, setUsername] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        setUsername(localStorage.getItem("username"));
        setRole(localStorage.getItem("role"));
    }, []);

    return (
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold capitalize text-foreground">
                    {role} Portal
                </h2>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4" />
                    </div>
                    <span>{username}</span>
                </div>
            </div>
        </header>
    );
}
