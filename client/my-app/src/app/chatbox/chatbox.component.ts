import { Component, ElementRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as io from 'socket.io-client';
import { ChatModel }    from '../chat-model';

@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.css']
})
export class ChatboxComponent implements OnInit {
  server: any;
  model: any;

  constructor(
    private elementRef:ElementRef,
    private http: HttpClient
  ) {

    var server = location.protocol+'//'+location.hostname;
    if(location.hostname == "localhost" && location.port == "4200"){
      server = location.protocol+'//'+location.hostname+ ':3000'
    }
  
    console.log(server);
    this.server = io(server);
    this.model = new ChatModel('');

    this.server.emit('welcome'); 
  }

  //get diagnostic() { return JSON.stringify(this.model); }

  onSubmit() { 
    var m = this.model.m;

    //append user message to chatbox
    var history = this.elementRef.nativeElement.querySelector('.history');
    history.insertAdjacentHTML('beforeend', '<li class="user balloon">' + m + '</li>');

    //send user message to server
    this.server.emit('msg', m);

    this.model.m = "";
  }

  onKeyDown() {
    //send user message to server
    this.server.emit('typing'); 
    //show this in the interface
  }

  ngOnInit() {
      var history = this.elementRef.nativeElement.querySelector('.history');
      
      // When we receive a customer message, display it
      this.server.on('agentmsg', function(data){
        console.log(data);
        //append agent chat message to chatbox
        history.insertAdjacentHTML('beforeend', '<li class="agent balloon">' + data.message + '</li>');
      });
      // When we receive a system error, display it
      this.server.on('systemerror', function(error) {
          var errorText = error.type + ' - ' + error.message;
          console.log(errorText);
      });

  }

}









