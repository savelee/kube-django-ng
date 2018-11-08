import { Component, ElementRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {NgForm} from '@angular/forms';
import * as io from 'socket.io-client';
import $ from 'jquery';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent implements OnInit {
  server: any;
  constructor(
    private elementRef:ElementRef,
    private http: HttpClient
  ) {
  
    var me = this;
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
  }

  intentMatching(query){
    this.server.emit('msg', query);
    this.updateChatBox(query, null);
  }

  updateChatBox(query, msg) {
    var history = this.elementRef.nativeElement.querySelector('.history');  

    if(msg){
      //append agent chat message to chatbox
      history.insertAdjacentHTML('beforeend', '<li class="agent balloon">' + msg + '</li>');

    } else {    
      history.insertAdjacentHTML('beforeend', '<li class="user balloon">' + query + '</li>');
    }
    $(".chatarea").stop().animate({ scrollTop: $(".chatarea")[0].scrollHeight}, 1000);
  }

  onSubmit(f: NgForm) { 
    var m = f.value.m;
    this.intentMatching(m);
    f.reset();
  }

  onKeyDown() {
    //send user message to server
    //this.server.emit('typing'); 
    //show this in the interface
  }

  ngOnInit() {
    var me = this;
    this.server.emit('welcome'); 

    // When we receive a customer message, display it
    this.server.on('agentmsg', function(data){
      console.log(data);
      me.updateChatBox(null, data.message);
    });
    // When we receive a system error, display it
    this.server.on('systemerror', function(error) {
        var errorText = error.type + ' - ' + error.message;
        console.log(errorText);
    });
  }

}








