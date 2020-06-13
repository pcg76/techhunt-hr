import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const url = 'http://localhost:3000/users';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private httpClient: HttpClient) { }

  public getEmployees() {
    return this.httpClient.get(url +'?minSalary=0&maxSalary=4000&offset=0&limit=30&sort=+name');
  }
}
