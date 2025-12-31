import React from "react";

// Render profit amount field
type props = {
    disabled: boolean,
    multiplier: number;
    profit: number;
    icon: any
}
const ProfitAmount: React.FC<props> = ({ disabled, multiplier, profit, icon }) => (
    <div className="space-y-2">
        <p className={`text-xs font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
            Total profit {`(${multiplier})x`}
        </p>
        <div
            className={`rounded-xl flex w-full items-center border border-gray-200 hover:border-gray-400 ${disabled ? "bg-gray-50" : "bg-white"
                } px-4 py-3 transition-all duration-200 shadow-sm`}
        >
            <input
                disabled={disabled}
                type="number"
                value={profit}
                placeholder="0.00"
                className={`${disabled ? "bg-gray-50" : "bg-white"
                    } text-gray-900 font-medium w-full flex-1 text-sm focus:outline-none`}
            />
            <div className="w-5 ml-2">
                {icon}
            </div>
        </div>
    </div>
);

export default ProfitAmount