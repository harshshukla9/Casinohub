'use client'
import { useEffect, useState } from "react";
import { PercentSvg } from "@/components/svgs";

const MineCustomInput = ({
  disabled,
  onChange,
  value,
  label,
}: {
  disabled: boolean;
  onChange: (e: number) => void;
  value: number;
  label: string;
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [inputValue, seInputValue] = useState(value);
  const handleChange = (v: number) => {
    seInputValue(v);
  };

  useEffect(() => {
    if (!visible) onChange(0);
    else onChange(inputValue);
  }, [visible, inputValue]);
  return (
    <div className="flex flex-col space-y-2">
      {label && (
        <p className={`text-xs font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
          {label}
        </p>
      )}
      <div className="flex bg-gray-100 overflow-hidden p-1 rounded-xl border border-gray-200 shadow-sm">
        <button
          className={`px-3 py-2 text-gray-700 rounded-lg focus:outline-none text-xs font-medium transition-all duration-200 ${visible == false && "bg-white shadow-sm text-black"
            } ${!disabled && "hover:bg-gray-50"}`}
          onClick={() => !disabled && setVisible(false)}
        >
          Reset
        </button>
        <button
          onClick={() => !disabled && setVisible(true)}
          className={`px-3 py-2 text-gray-700 focus:outline-none rounded-lg text-xs font-medium text-nowrap transition-all duration-200 ${visible && "bg-white shadow-sm text-black"
            } ${!disabled && "hover:bg-gray-50"}`}
        >
          Increase By:
        </button>
        <div
          className={`flex ${!visible || disabled ? "bg-gray-50" : "bg-white"
            } rounded-r-lg border-l border-gray-200 w-full`}
        >
          <input
            type="number"
            value={visible ? inputValue : value}
            min={0}
            disabled={disabled || !visible}
            placeholder="0"
            onChange={(e) => handleChange(Number(e.target.value))}
            className="px-3 py-2 text-gray-900 font-medium bg-transparent w-full focus:outline-none text-sm"
          />
          <div className="flex items-center justify-center pl-2 pr-3 w-[35px]">
            <PercentSvg />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MineCustomInput