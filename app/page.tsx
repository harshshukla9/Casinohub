import Button from "@/components/casinoHub/Button";
import { GameSelection } from "@/components/shared/GameSelection";
import Image from "next/image";

export default function Home() {
  return (
    // <GameSelection />
    <div className="w-full h-fit">
      <div className="w-full md:h-screen h-fit overflow-hidden bg-red-300 rounded-xl">
        <div className="w-full h-[8vh] flex items-center justify-end bg-blue-300">
          <Button />
        </div>
        <div className="w-full h-fit flex flex-col items-center justify-center  md:justify-center bg-yellow-300 py-12">
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col items-center">
              <h1 className="text-4xl font-bold">Varity Casino</h1>
              <span className="text-sm text-foreground/50">OnChain Gaming done right!</span>
            </div>
            <Button />
          </div>
          <div className="md:flex hidden  flex-col md:flex-row w-full h-fit items-center justify-center overflow-hidden bg-gray-500">
            <div className="w-full md:w-[45vw] h-[20vh] shrink-0 bg-green-300">
              <Image src={"/casinohub/image.png"} alt="shied" width={500} height={500} />
            </div>
            <div className="w-full md:w-[45vw] h-[20vh] shrink-0 bg-blue-300"></div>
            <div className="w-full md:w-[45vw] h-[20vh] shrink-0 bg-purple-300"></div>
          </div>
        </div>

      </div>

      <div className="flex flex-col mt-4 md:flex-row gap-2 p-1 w-full h-fit items-center justify-center overflow-hidden">
        <div className="w-full md:w-[45vw] p-2 flex items-center justify-center rounded-md h-[20vh] shrink-0 bg-green-300">
          <div className="w-[40vw] h-full p-4">
            <Image src={"/casinohub/image.png"} alt="shied" width={500} height={500} className="w-full h-full object-contain" />
          </div>
          <div className="w-full h-fit flex flex-col items-end">
            <h1 className="font-sans text-xl font-bold">Provably Fair</h1>
            <span className="text-xs text-foreground/50 text-right leading-tighter">Every game outcome is <br /> cryptographically verifiable <br />Verify any bet on-chain at any time.</span>
          </div>
        </div>
        <div className="w-full md:w-[45vw] p-2 flex items-center justify-center rounded-md h-[20vh] shrink-0 bg-blue-300">
          <div className="w-full h-fit flex flex-col items-start">
            <h1 className="font-sans text-xl font-bold">Casiono</h1>
            <span className="text-xs text-foreground/50 text-left leading-tighter">4+ Games ready to play.</span>
          </div>
          <div className="w-[50vw] h-full">
            <Image src={"/casinohub/casino.gif"} alt="gif" width={500} height={500} className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="w-full md:w-[45vw] rounded-md h-[20vh] shrink-0 bg-purple-300"></div>
      </div>
    </div >
  );
}
