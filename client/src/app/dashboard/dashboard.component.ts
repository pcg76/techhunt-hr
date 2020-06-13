import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ApiService } from './api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  employees;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.getEmployees().subscribe((data) => {
      console.log(data);
      this.employees = data['results'];
    });
  }

  ngAfterViewInit() {

  }
}
