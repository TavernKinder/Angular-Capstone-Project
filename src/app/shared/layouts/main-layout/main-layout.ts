import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { ErrorModal } from '../../components/error-modal/error-modal';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Header, Footer, ErrorModal],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {}
