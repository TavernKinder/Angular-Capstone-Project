import { Component } from '@angular/core';

interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
}

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  readonly slides: CarouselSlide[] = [
    {
      id: 'nutrition',
      title: 'Track your nutrition',
      description:
        'Search the USDA database, log your meals each day and watch your calories and macros add up.',
      imageUrl: '/img/nutrition-light.png',
      imageAlt: 'Nutrition log showing logged foods and a daily total of calories, protein, carbs and fat',
    },
    {
      id: 'weather',
      title: 'Check the weather',
      description:
        'See current conditions for your saved location and a 7-day outlook before you head out to train.',
      imageUrl: '/img/weather-light.png',
      imageAlt: 'Weather forecast card showing current temperature, feels like, humidity, wind and precipitation',
    },
    {
      id: 'workout',
      title: 'Plan your workouts',
      description:
        'Build a weekly routine from the exercise library and see your workouts grouped by day.',
      imageUrl: '/img/workout-light.png',
      imageAlt: 'Weekly workout schedule with workouts arranged in columns from Monday to Sunday',
    },
  ];
  activeSlideIndex = 0;

  get activeSlide(): CarouselSlide | null {
    return this.slides[this.activeSlideIndex] ?? null;
  }

  showPrevious(): void {
    if (this.slides.length < 2) return;
    this.activeSlideIndex = (this.activeSlideIndex - 1 + this.slides.length) % this.slides.length;
  }

  showNext(): void {
    if (this.slides.length < 2) return;
    this.activeSlideIndex = (this.activeSlideIndex + 1) % this.slides.length;
  }

  showSlide(index: number): void {
    if (index < 0 || index >= this.slides.length) return;
    this.activeSlideIndex = index;
  }
}
