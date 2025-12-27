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
    return (
        <Carousel className="w-full">
            <CarouselContent>
                {Array.from({ length: 5 }).map((_, index) => (
                    <CarouselItem key={index}>
                        <div className="p-1">
                            <Card className="p-0! overflow-hidden">
                                <CardContent className="flex aspect-square p-0!">
                                    {/* <span className="text-4xl font-semibold">{index + 1}</span> */}
                                    <Image src={"/games/mines.png"} alt="mines" width={500} height={500} className="w-full h-full object-cover" />
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
