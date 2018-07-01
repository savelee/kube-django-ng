import { Component, Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

@Injectable()
export class DashboardComponent implements OnInit {
  server: any;
  form: FormGroup;

  connection;
  searchConnection;

  public totals: String;
  public totalNegatives: String;
  public negatives: Array<any>;
  public unhandled: Array<any>;
  public searchresults: Array<any>;


  constructor(
    private http: HttpClient) {
    
    //TODO
    var server = location.protocol+'//'+location.hostname;
    if(location.hostname == "localhost" && location.port == "4200"){
      server = location.protocol+'//'+location.hostname+ ':3000'
    }

    this.server = io(server);
    this.server.emit('dashboardload');
  }

  ngOnInit() {    
    this.connection = this.inComming().subscribe(values => {
      this.totals = values.totals;
      this.totalNegatives = values.totalNegatives;
      this.negatives = values.negatives[0];
      this.unhandled = values.unhandled[0];
    });

    this.form = new FormGroup({
      sessionid: new FormControl()
    });

    this.searchConnection = this.inCommingSearchResults().subscribe(values => {
      this.searchresults = values;
    });
  }

  inComming(){
    let observable = new Observable<any>(observer => {
      // When we receive a customer message, display it
      this.server.on('dashboarddata', function(values){
        observer.next(values);
        //console.log(values);
      });

      return () => {
        this.server.disconnect();
      };  
    })     
    return observable;
  }

  inCommingSearchResults(){
    let observable = new Observable<any>(observer => {
      // When we receive a customer message, display it
      this.server.on('dashboardsearch', function(values){
        observer.next(values[0]);
        //console.log(values[0]);
      });

      return () => {
        this.server.disconnect();
      };  
    })     
    return observable;
  }

  onSubmit() { 
    var f = this.form;
    var sessionid = f.get('sessionid').value;
    this.server.emit('getsession', sessionid);
  }

}