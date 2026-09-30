import { Component } from '@angular/core';
import { Forcast } from '../forcast/forcast';

@Component({
  selector: 'app-dashboard-home',
  imports: [Forcast],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css',
})
export class DashboardHome {}
