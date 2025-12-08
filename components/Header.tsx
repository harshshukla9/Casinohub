'use client';

import { WalletActions } from './Home/WalletActions';
import { DepositButton } from './Home/DepositButton';
import { UserBalanceDisplay } from './Home/UserBalanceDisplay';
import { AudioController } from './AudioController';
import { User, Volume2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import Image from 'next/image';

export const Header = () => {
  const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false);
  const [isAudioPopoverOpen, setIsAudioPopoverOpen] = useState(false);

  // Pause/resume BGM when popovers open/close
  useEffect(() => {
    if (isUserPopoverOpen || isAudioPopoverOpen) {
      window.dispatchEvent(new CustomEvent('settings:open'));
    } else {
      window.dispatchEvent(new CustomEvent('settings:close'));
    }
  }, [isUserPopoverOpen, isAudioPopoverOpen]);

  return (
    <header className="bg-[#1F2326] border-b border-white/10">
      <div className="w-full px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4 mb-3">
          <Image src="/LOGO/LogooMines.svg" alt="Status Mines" width={100} height={100} className="w-[20vw] md:w-[20vw] lg:w-[6vw] h-full" />
          <div className="flex items-center gap-2">
            {/* Audio/Sound Icon - Separate Button */}
            <Popover open={isAudioPopoverOpen} onOpenChange={setIsAudioPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                  aria-label="Audio settings"
                >
                  <Volume2 className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 bg-[#1F2326] border-white/20" align="end">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">Audio Settings</p>
                  <AudioController />
                </div>
              </PopoverContent>
            </Popover>

            {/* User Icon */}
            <Popover open={isUserPopoverOpen} onOpenChange={setIsUserPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                  aria-label="User menu"
                >
                  <User className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 bg-[#1F2326] border-white/20" align="end">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Wallet</p>
                    <div className='flex gap-2'>
                      <WalletActions />
                      <UserBalanceDisplay />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <DepositButton />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* <div className="flex items-center justify-between w-full">
          <UserBalanceDisplay />
        </div> */}
      </div>
    </header>
  );
};