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
  public connectionDifferences;
  public connectionUserPhrases;
  public testIntents: string[];
  public testLanguages: string[];

  public userphrases: string[];
  public diffCols: string[] = ['name1', 'relativePath', 'type2', 'action'];
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
 
    this.server.on('loadUserPhrases', function(data) {
      this.userphrases = data;
    });

    this.server.on('loadIntents', function(data) {
      me.testIntents = data[0];
    });
    this.server.on('loadSupportedLanguages', function(data) {
      me.testLanguages = data;
      console.log(data);
    });

    // When we receive a system error, display it
    this.server.on('systemerror', function(error) {
        console.log(error.type + ' - ' + error.message);
    });

    this.connectionDifferences = this.updateRunDiff().subscribe(changes => {
      this.changes = new DiffDataSource(changes);
    });

    this.connectionUserPhrases = this.updateUserPhrases().subscribe(phrases => {
      this.userphrases = phrases;
    });
  }

  onClickDeployDevtoTest() {
    this.server.emit('acceptanceInput', 'deployDevToTest');
  }
  onClickDeployTestoProd() {
    this.server.emit('acceptanceInput', 'deployTestToProduction');
  }
  onClickRollback() {
    this.server.emit('acceptanceInput', 'rollback');
  }
  onClickRollbackDev() {
    this.server.emit('acceptanceInput', 'rollbackDev');
  }
  onClickRunDiff() {
    this.server.emit('acceptanceInput', 'runDiff');
  }
  onClickLoadUserPhrases(e, item) {
    this.server.emit('acceptanceInput', 'loadUserPhrases', item);
  }

  updateRunDiff() {
      this.server.emit('acceptanceInput', 'loadUserPhrases', null);
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

  updateUserPhrases() {
    const observable = new Observable<any>(observer => {
      // When we receive a customer message, display it
      this.server.on('loadUserPhrases', function(values) {
        observer.next(values);
      });

      return () => {
        this.server.disconnect();
      };
    });
    return observable;
  }
}

export interface ChangeData {
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
  constructor(private data: ChangeData[]) {
    super();
  }
   /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<ChangeData[]> {
    return of(this.data);
  }

  disconnect() {}
}