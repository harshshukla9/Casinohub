import React from "react";
import Input from "./Input";

type props = { onChange: Function, disabled?: boolean, value: number };

const MultiPlierInput: React.FC<props> = ({ onChange, disabled, value }) => {
    return <div className="mt-4 flex flex-col space-y-2">
        <p className={`text-xs font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
            Target Multiplier (Optional)
        </p>
        <div className="flex bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-400 transition-all duration-200 shadow-sm">
            <Input onChange={onChange} value={value} disabled={disabled} className="text-black" />
            <div className="relative flex border-l border-gray-200">
                <button
                    disabled={disabled}
                    onClick={() =>
                        onChange((value / 2).toFixed(2) || "0")
                    }
                    className={`px-4 py-3 text-gray-700 font-medium w-10 focus:outline-none ${disabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50 active:bg-gray-100 active:scale-95 transform transition-transform"}`}
                >
                    <DownSvg />
                </button>
                <div className="absolute w-px bg-gray-200 left-1/2 top-[20%] bottom-[20%] transform -translate-x-1/2" />
                <button
                    onClick={() =>
                        onChange((value * 2).toFixed(2) || "0")
                    }
                    disabled={disabled}
                    className={`px-4 py-3 text-gray-700 font-medium w-10 focus:outline-none ${disabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50 active:bg-gray-100 active:scale-95 transform transition-transform"}`}
                >
                    <UpSvg />
                </button>
            </div>
        </div>
    </div>
}

export default MultiPlierInput;


const DownSvg = () => {
    return <svg fill="currentColor" viewBox="0 0 64 64" >
        <title></title>
        <path
            d="M32.271 49.763 9.201 26.692l6.928-6.93 16.145 16.145 16.144-16.144 6.93 6.929-23.072 23.07h-.005Z"></path>
    </svg>
}

const UpSvg = () => {
    return <svg fill="currentColor" viewBox="0 0 64 64">
        <title></title>
        <path d="M32.271 17 9.201 40.071 16.128 47l16.145-16.145L48.418 47l6.93-6.929L32.275 17h-.005Z"></path>
    </svg>
}
