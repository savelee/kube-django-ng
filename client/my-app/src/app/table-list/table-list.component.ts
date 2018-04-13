import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-table-list',
  templateUrl: './table-list.component.html',
  styleUrls: ['./table-list.component.css']
})
export class TableListComponent implements OnInit {

  title = 'Django Video Games v.2';

  mypath: String;
  userPath: String;
  games: Object[];
  users: any;

  constructor(private http: HttpClient) {

    //TODO
    var gamesUrl = location.protocol+'//'+location.hostname+'/api/games/?format=json';
    if(location.hostname == "localhost" && location.port == "4200"){
      gamesUrl = location.protocol+'//'+location.hostname+ ':8080/games/?format=json'
    }

    var usersUrl = location.protocol+'//'+location.hostname+'/api/users/?format=json';
    if(location.hostname == "localhost" && location.port == "4200"){
      usersUrl = location.protocol+'//'+location.hostname+ ':8080/users/?format=json'
    }

    //full = "http://35.195.92.162:8080/games/?format=json";
    //http://localhost:8080/users/current/?format=json


    this.http.get(gamesUrl).subscribe(data => {
      // Read the result field from the JSON response.
      var games = [];
      for (var game in data) {
          games.push(data[game]['name']);
      }
      this.games = games;
      this.mypath = gamesUrl;
    });

    this.http.get(usersUrl).subscribe(data => {
      this.users = data;
      this.userPath = usersUrl;
    });


  }

  ngOnInit() {
  }

}





