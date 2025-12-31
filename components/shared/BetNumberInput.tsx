import React from "react";
import { InfinitySvg } from "@/components/svgs";

// Render profit amount field
type props = {
    disabled: boolean,
    value: number;
    onChange: (v: number) => void;
    Icon?: any
}

const BetNumberInput: React.FC<props> = ({ disabled, value, onChange, Icon }) => (
    <div className="space-y-2">
        <div className="flex justify-between">
            <p className={`text-xs font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
                Number of Bets
            </p>
        </div>
        <div
            className={`flex w-full items-center border border-gray-200 hover:border-gray-400 ${disabled ? "bg-gray-50" : "bg-white"
                } rounded-xl px-4 py-3 transition-all duration-200 shadow-sm`}
        >
            <input
                disabled={disabled}
                type="number"
                value={value}
                min={0}
                placeholder="0"
                onChange={(e) => onChange(Number(e.target.value))}
                className={`${disabled ? "bg-gray-50" : "bg-white"
                    } text-gray-900 font-medium w-full flex-1 text-sm focus:outline-none`}
            />
            {value === 0 && (
                <div className="w-5 ml-2">
                    <InfinitySvg />
                </div>
            )}
        </div>
    </div>
);

export default BetNumberInput;