// Render switch tab (Manual/Auto)
const SwitchTab = ({ active, options, disabled, onChange, type }: { disabled?: boolean, active: number, options?: string[], onChange: (e: number) => void, type?: string }) => (
    <div className={`flex flex-row p-1.5 ${type === "sub" ? "" : "rounded-xl "} bg-gray-100 border border-gray-200 mt-4 shadow-sm`}>
        {(options || ["Manual", "Auto"]).map((label, index) => (
            <button
                key={index}
                className={`w-full ${type === "sub" ? "" : "rounded-lg "} font-semibold text-sm transition-all duration-200 py-2.5 ${disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-700"
                    } ${active === index ? "bg-white shadow-md text-black" : "bg-transparent hover:bg-gray-50"}`}
                onClick={() => !disabled && onChange(index)}
            >
                {label}
            </button>
        ))}
    </div>
);


export default SwitchTab;