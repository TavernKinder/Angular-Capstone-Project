import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { ErrorModal } from '../../components/error-modal/error-modal';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, Header, Footer, ErrorModal],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout {}
