import { Component, OnInit, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Location } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    private error: any;
    private username: any;
    private server: string;

    loggedIn: boolean;
    model = new UserModel('','','','');

    form: FormGroup;

    constructor(private http: HttpClient, private formBuilder: FormBuilder, private element: ElementRef) {

      this.loggedIn = false;
      this.error = false;
      this.http = http;

      this.server = `${location.protocol}//${location.hostname}/api`;
      if(location.hostname == "localhost" && location.port == "4200"){
        this.server = `${location.protocol}//${location.hostname}:8080`
      }
    }

    ngOnInit(){
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
        var f = this.form;
        var username = f.get('username').value;
        var password = f.get('password').value;

        this.http.post(`${this.server}/authenticate/`, {
            "username": username, 
            "password": password 
        }).subscribe(token => {
            // Read the result field from the JSON response.
            this.setSession(token);
            this.loggedIn = true;
            this.username = username;
            this.error = "";
            location.href = location.href;
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
        location.href = location.href;
    }

    private setSession(auth) {
        localStorage.setItem('token', auth.token);
        
        var usersUrl = `${this.server}/users/current/?format=json`
        this.http.get(usersUrl).subscribe(user => {
            localStorage.setItem('user', JSON.stringify(user));
        });  
    } 

}

export class UserModel {
    constructor(
        public first_name: string,
        public last_name: string,
        public username: string,
        public email: string
      ) {}
}