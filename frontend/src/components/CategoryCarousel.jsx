import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Button } from './ui/button';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSearchedQuery } from '@/redux/jobSlice';

const category = [
    "Frontend Developer",
    "Backend Developer",
    "Data Science",
    "Graphic Designer",
    "FullStack Developer"
]

const CategoryCarousel = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const searchJobHandler = (query) => {
        dispatch(setSearchedQuery(query));
        navigate("/browse");
    }

    return (
        <div className="relative my-21 max-w-4xl mx-auto px-13">
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                    slidesToScroll: 3,
                }}
                className="w-full"
            >
                <CarouselContent className="-mx-">
                    {
                        category.map((cat, index) => (
                            <CarouselItem key={index} className="pl-0 basis-1/3">
                                <div className="px-3">
                                    <Button 
                                        onClick={() => searchJobHandler(cat)} 
                                        variant="outline" 
                                        className="rounded-full border-accent hover:bg-accent/2 hover:text-accent transition-all duration-300 w-full"
                                    >
                                        {cat}
                                    </Button>
                                </div>
                            </CarouselItem>
                        ))
                    }
                </CarouselContent>
                <CarouselPrevious 
                    className="absolute -left-9 top-1/2 -translate-y-1/2 bg-white shadow-md border-accent/30 hover:bg-accent/10 hover:text-accent" 
                />
                <CarouselNext 
                    className="absolute -right-6 top-1/2 -translate-y-1/2 bg-white shadow-md border-accent/30 hover:bg-accent/10 hover:text-accent" 
                />  
            </Carousel>
        </div>
    )
}

export default CategoryCarousel