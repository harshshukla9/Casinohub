"use client";

import { motion } from "framer-motion";
import { Header } from "./Header";
import { GameBoard } from "./GameBoard";
import { Controls } from "./Controls";

export const GameLayout = () => {
  return (
    <div
      className="flex flex-col lg:flex-row w-full lg:gap-6 h-full lg:justify-between lg:w-full relative bg-[#1D1B1E] lg:p-2"
    >
      <div className="lg:flex lg:flex-col  lg:h-full lg:w-[35vw] lg:rounded-xl lg:overflow-hidden lg:gap-2 lg:bg-[#240B53]">
      {/* // 1 */}
      <Header />
      <div className="p-2 sm:p-4 hidden lg:block">
            <Controls />
          </div>
      </div>
      {/* 2 */}
        <div className="w-full  overflow-hidden relative h-full">
          <GameBoard />
        </div>

        {/* 3 */}
          <div className="p-2 lg:hidden sm:p-4 bg-[#1F2326]">
            <Controls />
          </div>
    </div>
  );
};
