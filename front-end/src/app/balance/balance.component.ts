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

  public balanceAccount1: String;
  public balanceAccount2: String;
  public balanceCC: String;
  public balanceSavings: String;

  public balanceDataSource1: any;
  public balanceDataSource2: any;
  public ccDataSource1: any;
  public savingsDataSource1: any;

  public cols: string[] = ['LOGO' ,'NAME', 'DATE', 'AMOUNT'];
  public filters: string[];

  constructor() { 

    //hardcoded account balances
    this.balanceAccount1 = account1Feed.BALANCE;
    this.balanceAccount2 = account2Feed.BALANCE;
    this.balanceCC = ccFeed.BALANCE;
    this.balanceSavings= savingsFeed.BALANCE;
  
    this.balanceDataSource1 = new MatTableDataSource(account1Feed.OVERVIEW);
    this.balanceDataSource2 = new MatTableDataSource(account1Feed.OVERVIEW);
    this.ccDataSource1 = new MatTableDataSource(account1Feed.OVERVIEW);
    this.savingsDataSource1 = new MatTableDataSource(account1Feed.OVERVIEW);
    
  }

  applyFilter(filterValue: string) {

    if(Array.isArray(filterValue)){
      filterValue = filterValue.toString();
    }

    this.balanceDataSource1.filter = filterValue.trim().toLowerCase();
  }

  spentFilter(): (data: any, filter: string) => boolean {
    let filterFunction = function(data, filter): boolean {
      return data.CATEGORY.toLowerCase().indexOf(filter) !== -1 && data.AMOUNT.indexOf('-') !== -1;
    }
    return filterFunction;
  } 

  incomeFilter(): (data: any, filter: string) => boolean {
    let filterFunction = function(data, filter): boolean {
      return data.CATEGORY.toLowerCase().indexOf(filter) !== -1 && data.AMOUNT.indexOf('-') == -1;
    }
    return filterFunction;
  } 


  ngOnInit() {
    var me = this;
    var server = location.protocol+'//'+location.hostname; //TODO
    if(location.hostname == "localhost" && location.port == "4200"){
      server = location.protocol+'//'+location.hostname+ ':3000'
    }

    //console.log(server);
    this.server = io(server);
    this.server.on('agentmsg', function(data){
      
      if(data.message && data.message.name == "spent"){
        var category = data.message.param;
        //filter on spent
        me.balanceDataSource1.filterPredicate = me.spentFilter();
        me.applyFilter(category);

        //TODO figure out which balance tab is active in order to detect the data source

      }
      if(data.message && data.message.name == "salary"){
        var category = data.message.param;

        //Filter on Salary
        me.balanceDataSource1.filterPredicate = me.incomeFilter();
        me.applyFilter(category);

        //TODO figure out which balance tab is active in order to detect the data source
      }

    });
    // When we receive a system error, display it
    this.server.on('systemerror', function(error) {
        var errorText = error.type + ' - ' + error.message;
        console.log(errorText);
    });
  }

  intentMatching(query){
    //submit intent to Dialogflow
    this.server.emit('msg', query);
    //Intent matching, display it
  }

  onSubmit(f: NgForm) { 
    this.balanceDataSource1.filter = ""; 
    this.balanceDataSource2.filter = ""; 
    this.ccDataSource1.filter = ""; 
    this.savingsDataSource1.filter = ""; 
    
    var query = f.value.balance;   
    this.intentMatching(query);
    f.reset();
  }

}

var account1Feed = {
  "BALANCE": '$19,200.85',
  "OVERVIEW": [{
    "LOGO" : "../../assets/img/logos/uberlogo.png",
    "NAME" : "Uber",
    "TIME" : "10 min ago",
    "ALT_TIME": "25/09/2018 17:02",
    "AMOUNT": '-$10.99',
    "MAPS": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147",
    "CATEGORY": "Taxis"
  },
  {
    "LOGO" : "../../assets/img/logos/gamemania.png",
    "NAME" : "GameMania",
    "TIME" : "yesterday 15:12",
    "ALT_TIME": "24/09/2018 15:12",
    "AMOUNT": '-$59.99',
    "MAPS": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147",
    "CATEGORY": "Fun"
  },
  {
    "LOGO" : "../../assets/img/logos/profile.png",
    "NAME" : "Michele Appello",
    "TIME" : "yesterday 12:00",
    "ALT_TIME": "24/09/2018 12:00",
    "AMOUNT": '$80.00',
    "DETAILS": "Money for Dinner",
    "MAPS": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147",
    "CATEGORY": "Transfers"
  },
  {
    "LOGO" : "../../assets/img/logos/google.png",
    "NAME" : "Company Foo",
    "TIME" : "22/09 11:20",
    "ALT_TIME": "22/09/2018 11:20",
    "AMOUNT": '$3000.00',
    "DETAILS": "Salary August 2018",
    "MAPS": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147",
    "CATEGORY": "Salary"
  },
  {
    "LOGO" : "../../assets/img/logos/bank.png",
    "NAME" : "The Future Bank",
    "TIME" : "21/09 09:00",
    "ALT_TIME": "21/09/2018 09:00",
    "AMOUNT": '-$1500.00',
    "DETAILS": "Mortgage",
    "MAPS": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147",
    "CATEGORY": "Mortgage"
  },
  {
    "LOGO" : "../../assets/img/logos/profile.png",
    "NAME" : "Utility Company",
    "TIME" : "21/09 09:00",
    "ALT_TIME": "21/09/2018 09:00",
    "AMOUNT": '-$230.00',
    "DETAILS": "Electricy",
    "MAPS": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147",
    "CATEGORY": "Light & Electricity"
  },
  {
    "LOGO" : "../../assets/img/logos/profile.png",
    "NAME" : "Grocery Store",
    "TIME" : "20/09 18:10",
    "ALT_TIME": "20/09/2018 18:10",
    "AMOUNT": '-$23.40',
    "DETAILS": "Groceries",
    "MAPS": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147",
    "CATEGORY": "Groceries"
  },
  {
    "LOGO" : "../../assets/img/logos/uberlogo.png",
    "NAME" : "Uber",
    "TIME" : "19/09 18:10",
    "ALT_TIME": "19/09/2018 22:42",
    "AMOUNT": '-$8.75',
    "MAPS": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147",
    "CATEGORY": "Taxis"
  },
  {
    "LOGO" : "../../assets/img/logos/pizza.png",
    "NAME" : "Pizza Restaurant",
    "TIME" : "19/09 18:10",
    "ALT_TIME": "19/09/2018 22:42",
    "AMOUNT": '-$10.99',
    "MAPS": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147",
    "CATEGORY": "Restaurants"
  },
  {
    "LOGO" : "../../assets/img/logos/profile.png",
    "NAME" : "Michele Appello",
    "TIME" : "18/09 12:00",
    "ALT_TIME": "18/09/2018 12:00",
    "AMOUNT": '-$55',
    "DETAILS": "Money for Dinner last night",
    "MAPS": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2437.7995042963175!2d4.86977811605297!3d52.33778327978019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c60a05af168f5b%3A0x3e5bfe6e0b2ce441!2sGoogle!5e0!3m2!1snl!2sus!4v1536682639147",
    "CATEGORY": "Transfers"
  }

]
};

var account2Feed = {
  "BALANCE": '$2,650.22',
  "OVERVIEW": []
};


var ccFeed = {
  "BALANCE": '$402.00',
  "OVERVIEW": []
};

var savingsFeed = {
  "BALANCE": '$59,730.00',
  "OVERVIEW": []
};