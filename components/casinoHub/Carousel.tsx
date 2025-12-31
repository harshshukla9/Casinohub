import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import Image from "next/image"

export function CarouselDemo() {
    const images = [
        "/casinoHub/Mines.png",
        "/casinoHub/Crash.png",
        "/casinoHub/Slide.png",
        "/casinoHub/Plinko.png",
    ]
    return (
        <Carousel className="w-full">
            <CarouselContent>
                {Array.from({ length: images.length }).map((_, index) => (
                    <CarouselItem key={index}>
                        <div className="p-1">
                            <Card className="p-0! overflow-hidden">
                                <CardContent className="flex aspect-square h-[40vh]  p-0!">
                                    <Image src={images[index]} alt="mines" width={1000} height={1000} className="w-full h-full object-cover" />
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
    )
}
