"use client";

import { redirect } from "next/navigation";

export default function AccountPage() {
    // Redirect to profile as default
    redirect("/account/profile");
}
