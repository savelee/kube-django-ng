/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { Component, OnInit } from '@angular/core';
import {MatTableDataSource} from '@angular/material';
import {NgForm} from '@angular/forms';
import * as io from 'socket.io-client';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0', display: 'none'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})

export class BalanceComponent implements OnInit {

  server: any;

  public balanceAccount1: string;
  public balanceAccount2: string;
  public balanceCC: string;
  public balanceSavings: string;

  public balanceDataSource1: any;
  public balanceDataSource2: any;
  public ccDataSource1: any;
  public savingsDataSource1: any;

  public cols: string[] = ['LOGO', 'NAME', 'DATE', 'AMOUNT'];
  public filters: string[];

  constructor() {

    // hardcoded account balances
    this.balanceAccount1 = account1Feed.BALANCE;
    this.balanceAccount2 = account2Feed.BALANCE;
    this.balanceCC = ccFeed.BALANCE;
    this.balanceSavings = savingsFeed.BALANCE;

    this.balanceDataSource1 = new MatTableDataSource(account1Feed.OVERVIEW);
    this.balanceDataSource2 = new MatTableDataSource(account1Feed.OVERVIEW);
    this.ccDataSource1 = new MatTableDataSource(account1Feed.OVERVIEW);
    this.savingsDataSource1 = new MatTableDataSource(account1Feed.OVERVIEW);
  }

  applyFilter(filterValue: string) {

    if (Array.isArray(filterValue)) {
      filterValue = filterValue.toString();
    }

    this.balanceDataSource1.filter = filterValue.trim().toLowerCase();
  }

  
  spentFilter(): (data: any, filter: string) => boolean {
    let filterFunction = function(data, filter): boolean {
      // Filter the grid data with the search query, look for amounts that are negative, cause you are spending.
      return data.CATEGORY.toLowerCase().indexOf(filter) !== -1 && data.AMOUNT.indexOf('-') != -1;
    }
    return filterFunction;
  }

  incomeFilter(): (data: any, filter: string) => boolean {
    let filterFunction = function(data, filter): boolean {
      // Filter the grid data with the search query, look for amounts that are positive, it's incoming money
      return data.CATEGORY.toLowerCase().indexOf(filter) !== -1 && data.AMOUNT.indexOf('-') == -1;
    }
    return filterFunction;
  }


  ngOnInit() {
    const me = this;

    // NGNIX will route /socket.io to port 3000 in production
    let server = location.protocol+'//'+location.hostname;
    if(location.hostname == "localhost" && location.port == "4200"){
      server = `${location.protocol}//${location.hostname}:3000`
    }

    this.server = io(server);
    this.server.on('agentmsg', function(data) {
      if (data.username === 'BalanceBot' && data.message[0].action === 'spent') {
        const category = data.message[0].param;
        // filter on spent
        me.balanceDataSource1.filterPredicate = me.spentFilter();
        me.applyFilter(category);
      }
      if (data.username === 'BalanceBot' && data.message[0].action === 'income'){
        const category = data.message[0].param;

        // Filter on Salary
        me.balanceDataSource1.filterPredicate = me.incomeFilter();
        me.applyFilter(category);
      }

    });
    // When we receive a system error, display it
    this.server.on('systemerror', function(error) {
        console.log(error.type + ' - ' + error.message);
    });
  }

  intentMatching(query) {
    // submit intent to Dialogflow
    this.server.emit('msg', query);
    // Intent matching, display it
  }

  onSubmit(f: NgForm) {
    this.balanceDataSource1.filter = '';
    this.balanceDataSource2.filter = '';
    this.ccDataSource1.filter = '';
    this.savingsDataSource1.filter = '';

    const query = f.value.balance;
    this.intentMatching(query);
    f.reset();
  }

}

const account1Feed = {
  BALANCE: '$19,200.85',
  OVERVIEW: [{
    LOGO : '../../assets/img/logos/tcalogo.png',
    NAME : 'TCA',
    TIME : '10 min ago',
    ALT_TIME: '28/11/2019 10:02',
    AMOUNT: '-$10.99',
    MAPS: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147',
    CATEGORY: 'Taxis'
  },
  {
    LOGO : '../../assets/img/logos/gamemania.png',
    NAME : 'GameShop',
    TIME : 'yesterday 15:12',
    ALT_TIME: '27/11/2019 15:12',
    AMOUNT: '-$59.99',
    MAPS: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147',
    CATEGORY: 'Shopping'
  },
  {
    LOGO : '../../assets/img/logos/profile.png',
    NAME : 'Michele Appello',
    TIME : 'yesterday 12:00',
    ALT_TIME: '27/11/2019 12:00',
    AMOUNT: '$80.00',
    DETAILS: 'Money for Dinner',
    MAPS: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147',
    CATEGORY: 'Transfers'
  },
  {
    LOGO : '../../assets/img/logos/google.png',
    NAME : 'Company Foo',
    TIME : '26/11 11:20',
    ALT_TIME: '26/11/2019 11:20',
    AMOUNT: '$3000.00',
    DETAILS: 'Salary August 2019',
    MAPS: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147',
    CATEGORY: 'Salary'
  },
  {
    LOGO : '../../assets/img/logos/bank.png',
    NAME : 'The Future Bank',
    TIME : '25/11 09:00',
    ALT_TIME: '25/11/2019 09:00',
    AMOUNT: '-$1500.00',
    DETAILS: 'Mortgage',
    MAPS: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147',
    CATEGORY: 'Mortgage'
  },
  {
    LOGO : '../../assets/img/logos/profile.png',
    NAME : 'Utility Company',
    TIME : '24/11 09:00',
    ALT_TIME: '24/11/2019 09:00',
    AMOUNT: '-$230.00',
    DETAILS: 'Electricy',
    MAPS: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147',
    CATEGORY: 'Light & Electricity'
  },
  {
    LOGO : '../../assets/img/logos/profile.png',
    NAME : 'Grocery Store',
    TIME : '23/11 18:10',
    ALT_TIME: '23/11/2019 18:10',
    AMOUNT: '-$23.40',
    DETAILS: 'Groceries',
    MAPS: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147',
    CATEGORY: 'Shopping'
  },
  {
    LOGO : '../../assets/img/logos/tcalogo.png',
    NAME : 'TCA',
    TIME : '22/11 18:10',
    ALT_TIME: '22/11/2019 22:42',
    AMOUNT: '-$8.75',
    MAPS: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147',
    CATEGORY: 'Taxis'
  },
  {
    LOGO : '../../assets/img/logos/pizza.png',
    NAME : 'Pizza Restaurant',
    TIME : '19/11 18:10',
    ALT_TIME: '19/11/2019 22:42',
    AMOUNT: '-$10.99',
    MAPS: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147',
    CATEGORY: 'Restaurants'
  },
  {
    LOGO : '../../assets/img/logos/profile.png',
    NAME : 'Michele Appello',
    TIME : '18/11 12:00',
    ALT_TIME: '18/11/2019 12:00',
    AMOUNT: '-$55',
    DETAILS: 'Money for Dinner last night',
    MAPS: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147',
    CATEGORY: 'Transfers'
  }
]
};

const account2Feed = {
  BALANCE: '$2,650.22',
  OVERVIEW: []
};


const ccFeed = {
  BALANCE: '$402.00',
  OVERVIEW: []
};

const savingsFeed = {
  BALANCE: '$59,730.00',
  OVERVIEW: []
};
