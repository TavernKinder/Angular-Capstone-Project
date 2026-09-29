import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashHeader } from '../../components/dash-header/dash-header';
import { DashFooter } from '../../components/dash-footer/dash-footer';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, DashHeader, DashFooter],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout {}
