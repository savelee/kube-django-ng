/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { Component, Injectable, OnInit } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl } from '@angular/forms';
import { Observable,of } from 'rxjs';
import * as io from 'socket.io-client';

@Component({
  selector: 'app-my-dashboard',
  templateUrl: './my-dashboard.component.html',
  styleUrls: ['./my-dashboard.component.css']
})

@Injectable()
export class MyDashboardComponent implements OnInit {
  server: any;
  form: FormGroup;

  connection;
  searchConnection;

  //table columns
  negativeCols: string[] = ['SCORE', 'TEXT', 'SESSION'];
  unhandledintentsCols: string[] = ['TEXT', 'INTENT', 'SESSION'];
  trackedCols: string[] = ['POSTED' ,'TEXT', 'INTENT', 'SCORE'];

  //table data
  public totals: String;
  public totalNegatives: String;
  public negatives: NegativesSource;
  public unhandled: UnHandledSource;
  public searchresults: SearchDataSource;
  
  constructor(
    private http: HttpClient) {
    
    //only in localhost
    var server = location.protocol+'//'+location.hostname;
    if(location.hostname == "localhost" && location.port == "4200"
  || location.hostname == "localhost" && location.port == "4000"){
      server = location.protocol+'//'+location.hostname+ ':3000'
    } else {
      //server = location.protocol+'//'+location.hostname+ "/socket.io";
    }

    console.log(server);

    this.server = io(server);
    this.server.emit('dashboardload');

    this.connection = this.inComming().subscribe(values => {
      console.log("connection");
      this.totals = values.totals;
      this.totalNegatives = values.totalNegatives;
      this.negatives = new NegativesSource(values.negatives[0]);
      this.unhandled = new UnHandledSource(values.unhandled[0]);
    });
  }

  ngOnInit() {    

    this.form = new FormGroup({
      sessionid: new FormControl()
    });
    
    this.searchConnection = this.inCommingSearchResults().subscribe(values => {
      this.searchresults = new SearchDataSource(values);
    });
  }

  inComming(){
    let observable = new Observable<any>(observer => {
      // When we receive a customer message, display it
      this.server.on('dashboarddata', function(values){
        observer.next(values);
        console.log(values);
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
        console.log(values[0]);
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

export interface Data {
  CONFIDENCE: any,
  POSTED: any;
  TEXT: string;
  MAGNITUDE: any;
  INTENT: string;
  SCORE: any;
  SESSION: string;
}

export class NegativesSource extends DataSource<any> {
  constructor(private data: Data[]) {
    super();
  }
   /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<Data[]> {
    return of(this.data);
  }

  disconnect() {}
}

export class UnHandledSource extends DataSource<any> {
  constructor(private data: Data[]) {
    super();
  }
   /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<Data[]> {
    return of(this.data);
  }

  disconnect() {}
}

export class SearchDataSource extends DataSource<any> {
  constructor(private data: Data[]) {
    super();
  }
   /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<Data[]> {
    return of(this.data);
  }

  disconnect() {}
}
