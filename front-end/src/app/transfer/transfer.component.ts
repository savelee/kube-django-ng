import { Component, OnInit } from '@angular/core';
import { UploadEvent, UploadFile, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit {

  public files: UploadFile[] = [];
 
  public dropped(event: UploadEvent) {
    this.files = event.files;
    for (const droppedFile of event.files) {
 
      // Is it a file?
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
 
          // Here you can access the real file
          console.log(droppedFile.relativePath, file);
 
          const formData = new FormData();
          formData.append('upload', file, droppedFile.relativePath)
 
          // Headers
          const headers = new HttpHeaders({
            'Access-Control-Allow-Origin':'*',
            'security-token': 'mytoken'
          })
 

          var server = location.protocol+'//'+location.hostname;
          if(location.hostname == "localhost" && location.port == "4200"
        || location.hostname == "localhost" && location.port == "4000"){
            server = location.protocol+'//'+location.hostname+ ':3200'
          } else {
            //server = location.protocol+'//'+location.hostname+ "/socket.io";
          }
      
          console.log(server);

          this.http.post(server + '/upload', formData, { 
            headers: headers, 
            responseType: 'blob' 
          }).subscribe(data => {
            console.log(data);
          });
 
        });
      } else {
        // It was a directory (empty directories are added, otherwise only files)
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
        console.log(droppedFile.relativePath, fileEntry);
      }
    }
  }
 
  public fileOver(event){
    console.log(event);
  }
 
  public fileLeave(event){
    console.log(event);
  }

  constructor(private http: HttpClient) { }

  ngOnInit() {
  }

}
