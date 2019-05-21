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
import { Observable, of } from 'rxjs';
import { DataSource } from '@angular/cdk/collections';
import * as io from 'socket.io-client';

@Component({
  selector: 'app-test',
  templateUrl: './admin-test.component.html',
  styleUrls: ['./admin-test.component.scss']
})

@Injectable()
export class AdminTestComponent implements OnInit {
  server: any;
  connection;
  
  diffCols: string[] = ['name1', 'relativePath', 'type2'];

  public changes: DiffDataSource;

  constructor() { }

  ngOnInit() {
    const me = this;
    // only in localhost
    let server = location.protocol+'//'+location.hostname;
    if (location.hostname === 'localhost' && location.port === '4200'
  || location.hostname === 'localhost' && location.port === '4000'){
      server = location.protocol +  '//'+ location.hostname + ':3000'
    } else {
      // server = location.protocol+'//'+location.hostname+ '/socket.io';
    }

    console.log(server);

    this.server = io(server);
    this.server.on('acceptanceOutput', function(data) {
      console.log(data);
    });
    // When we receive a system error, display it
    this.server.on('systemerror', function(error) {
        console.log(error.type + ' - ' + error.message);
    });

    this.connection = this.updateRunDiff().subscribe(changes => {
      this.changes = new DiffDataSource(changes);
    });
  }

  onClickDeployDevtoTest() {
    this.server.emit('acceptanceInput', 'deployDevToTest');
  }
  onClickRunDiff() {
    this.server.emit('acceptanceInput', 'runDiff');
  }
  updateRunDiff() {
    const observable = new Observable<any>(observer => {
      // When we receive a customer message, display it
      this.server.on('acceptanceOutput', function(values) {
        observer.next(values);
      });

      return () => {
        this.server.disconnect();
      };
    });
    return observable;
  }

}

export interface Data {
  date1: any;
  level: number;
  name1: string;
  path1: string;
  relativePath: string;
  size1: number;
  state: string;
  type1: string;
  type2: string;
}

export class DiffDataSource extends DataSource<any> {
  constructor(private data: Data[]) {
    super();
  }
   /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<Data[]> {
    return of(this.data);
  }

  disconnect() {}
}