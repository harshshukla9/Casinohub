import CurrencyIcon from "./CurrencyIcon";
import Input from "./Input";

type props = { onChange: Function, disabled?: boolean, value: number, className?: string, label?: string, amount?: number };

const AmountInput: React.FC<props> = ({ onChange, disabled, value, className, label, amount }) => (
    <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
            <p className={`text-xs font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
                {label || "Amount"}
            </p>
            <div className="text-xs font-medium text-gray-500">
                ${amount || 0}
            </div>
        </div>
        <div className={`flex bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-400 transition-all duration-200 shadow-sm ${className}`}>
            <Input onChange={(e: number) => onChange(e)} value={value} disabled={disabled} type="number" className="text-black" icon={<CurrencyIcon />} />
            <div className="flex relative border-l border-gray-200">
                <button
                    disabled={disabled}
                    onClick={() => onChange(value / 2)}
                    className={`px-4 py-3 text-gray-700 font-medium text-sm focus:outline-none ${disabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50 active:bg-gray-100"} ${disabled ? '' : 'active:scale-95 transform transition-transform'}`}
                >
                    ½
                </button>
                <div className="absolute w-px bg-gray-200 left-1/2 top-[20%] bottom-[20%] transform -translate-x-1/2" />
                <button
                    disabled={disabled}
                    onClick={() => onChange(value * 2)}
                    className={`px-4 py-3 text-gray-700 font-medium text-sm focus:outline-none ${disabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50 active:bg-gray-100"} ${disabled ? '' : 'active:scale-95 transform transition-transform'}`}
                >
                    2×
                </button>
            </div>
        </div>
    </div>
);


export default AmountInput;