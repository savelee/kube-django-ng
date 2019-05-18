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
    if($(".chatarea").length > 0)
      $(".chatarea").stop().animate({ scrollTop: $(".chatarea")[0].scrollHeight}, 1000);
  }

  onSubmit(f: NgForm) { 
    var m = f.value.m;
    if(m.length > 0) this.intentMatching(m);
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
      if (data.username === 'Chatbot') {
        me.updateChatBox(null, data.message);
      }
    });
    // When we receive a system error, display it
    this.server.on('systemerror', function(error) {
        var errorText = error.type + ' - ' + error.message;
        console.log(errorText);
    });
  }

}








