"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    name: string;
    className?: string;
}

export function RadioGroup({
    value,
    onChange,
    options,
    name,
    className,
}: RadioGroupProps) {
    return (
        <div className={cn("flex gap-4", className)}>
            {options.map((option) => (
                <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <input
                        type="radio"
                        name={name}
                        value={option.value}
                        checked={value === option.value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm">{option.label}</span>
                </label>
            ))}
        </div>
    );
}
