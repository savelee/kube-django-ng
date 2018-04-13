import { Component, OnInit, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ROUTES } from '../sidebar/sidebar.component';
import { Location, LocationStrategy, PathLocationStrategy} from '@angular/common';
import { UserModel } from '../../user-model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
    private listTitles: any[];
    private toggleButton: any;
    private sidebarVisible: boolean;
    private error: any;
    private username: any;
    loggedIn: boolean;
    location: Location;
    model = new UserModel('','','','');

    form: FormGroup;

    constructor(location: Location, private http: HttpClient, private formBuilder: FormBuilder, private element: ElementRef) {
      this.location = location;
      this.sidebarVisible = false;
      this.loggedIn = false;
      this.error = false;
      this.http = http;
    }

    ngOnInit(){
      this.listTitles = ROUTES.filter(listTitle => listTitle);
      const navbar: HTMLElement = this.element.nativeElement;
      this.toggleButton = navbar.getElementsByClassName('navbar-toggle')[0];
    
      if(localStorage.getItem("user")) {
          this.loggedIn = true;
          var userJsonString = localStorage.getItem("user");
          this.username = JSON.parse(userJsonString).username;
      }

      this.form = this.formBuilder.group({
        username: [null, [Validators.required]],
        password: [null, Validators.required],
      });
    
    };

    onLogin(){
        var m = this.model;
        var f = this.form;
        var username = f.get('username').value;
        var password = f.get('password').value;
        var full = 'http://localhost:8080/authenticate/'; //TODO

        this.http.post(full, {
            "username": username, 
            "password": password 
        }).subscribe(token => {
            // Read the result field from the JSON response.
            this.setSession(token);
            this.loggedIn = true;
            this.username = username;
            this.error = "";
            },
            err => {
                this.loggedIn = false;
                this.error = "form-invalid";
            }
        );
    };
    onLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        this.loggedIn = false;
    }

    private setSession(auth) {
        localStorage.setItem('token', auth.token);
        
        //TODO
        var usersUrl = location.protocol+'//'+location.hostname+'/api/users/current/?format=json';
        if(location.hostname == "localhost" && location.port == "4200"){
          usersUrl = location.protocol+'//'+location.hostname+ ':8080/users/current/?format=json'
        }
        this.http.get(usersUrl).subscribe(user => {
            localStorage.setItem('user', JSON.stringify(user));
        });
    } 

    sidebarOpen() {
        const toggleButton = this.toggleButton;
        const body = document.getElementsByTagName('body')[0];
        setTimeout(function(){
            toggleButton.classList.add('toggled');
        }, 500);
        body.classList.add('nav-open');

        this.sidebarVisible = true;
    };
    sidebarClose() {
        const body = document.getElementsByTagName('body')[0];
        this.toggleButton.classList.remove('toggled');
        this.sidebarVisible = false;
        body.classList.remove('nav-open');
    };
    sidebarToggle() {
        // const toggleButton = this.toggleButton;
        // const body = document.getElementsByTagName('body')[0];
        if (this.sidebarVisible === false) {
            this.sidebarOpen();
        } else {
            this.sidebarClose();
        }
    };

    getTitle(){
      var titlee = this.location.prepareExternalUrl(this.location.path());
      if(titlee.charAt(0) === '#'){
          titlee = titlee.slice( 2 );
      }
      titlee = titlee.split('/').pop();

      for(var item = 0; item < this.listTitles.length; item++){
          if(this.listTitles[item].path === titlee){
              return this.listTitles[item].title;
          }
      }
      return 'Dashboard';
    }
}
