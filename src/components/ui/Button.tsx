

// Note: I don't have radix-ui installed, so I'll simplify this to just React props and standard button for now to avoid extra deps unless I install them.
// The user asked for Functional > Pretty.
// Let's make a simple consistent Button.

import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
                    {
                        "bg-blue-600 text-white hover:bg-blue-700": variant === "primary",
                        "bg-gray-100 text-gray-900 hover:bg-gray-200": variant === "secondary",
                        "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
                        "border border-gray-300 bg-transparent hover:bg-gray-100": variant === "outline",
                        "hover:bg-gray-100": variant === "ghost",
                        "h-8 px-3 text-sm": size === "sm",
                        "h-10 px-4 py-2": size === "md",
                        "h-12 px-6 text-lg": size === "lg",
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
