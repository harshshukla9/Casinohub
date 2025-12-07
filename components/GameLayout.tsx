"use client";

import { motion } from "framer-motion";
import { Header } from "./Header";
import { GameBoard } from "./GameBoard";
import { Controls } from "./Controls";

export const GameLayout = () => {
  return (
    <div
      className="flex flex-col md:flex-row md:gap-6 h-full md:justify-between md:w-full relative bg-[#1D1B1E] md:p-2 "
    >
      <div className="md:flex md:flex-col md:h-full md:w-[35vw] md:rounded-xl md:overflow-hidden md:gap-2 md:bg-[#240B53]">
      {/* // 1 */}
      <Header />
      <div className="p-2 sm:p-4 hidden md:block">
            <Controls />
          </div>
      </div>
      {/* 2 */}
        <div className="w-full  overflow-hidden relative h-full">
          <GameBoard />
        </div>

        {/* 3 */}
          <div className="p-2 md:hidden sm:p-4 bg-[#1F2326]">
            <Controls />
          </div>
    </div>
  );
};
