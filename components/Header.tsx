'use client';

import { WalletActions } from './Home/WalletActions';
import { DepositButton } from './Home/DepositButton';
import { UserBalanceDisplay } from './Home/UserBalanceDisplay';
import { AudioController } from './AudioController';
import { User } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import Image from 'next/image';

export const Header = () => {
  return (
    <header className="bg-[#1F2326] border-b border-white/10">
      <div className="w-full px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4 mb-3">
          <Image src="/LOGO/LogooMines.svg" alt="Karma Mines" width={100} height={100} className="w-full h-full" />
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                aria-label="User menu"
              >
                <User className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-[#240B53] border-white/20" align="end">
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Wallet</p>
                  <WalletActions />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Audio</p>
                  <AudioController />
                </div>
                <div className="pt-2 border-t border-white/10">
                  <DepositButton />
                </div>
                <div className="pt-2 border-t border-white/10">
                  <UserBalanceDisplay />
                </div>
              </div>

            </PopoverContent>
          </Popover>
        </div>

        {/* <div className="flex items-center justify-between w-full">
          <UserBalanceDisplay />
        </div> */}
      </div>
    </header>
  );
};