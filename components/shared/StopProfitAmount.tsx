import Input from "./Input";

const StopProfitAmount = ({ disabled, onChange, value, Icon, Label }: any) => (
    <div className="mt-4 space-y-2">
        <p className={`text-xs font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
            {Label}
        </p>
        <div className="w-full rounded-xl shadow-sm">
            <Input
                value={value}
                onChange={onChange}
                disabled={disabled}
                type={"number"}
                className={"rounded-xl text-black bg-white p-2"}
                icon={Icon} />
        </div>
    </div>
);

export default StopProfitAmount;