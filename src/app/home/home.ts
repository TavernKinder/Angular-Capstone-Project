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
  readonly slides: CarouselSlide[] = [];
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
