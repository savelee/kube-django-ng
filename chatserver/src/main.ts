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


import * as sourceMapSupport from 'source-map-support';
import { createServer } from 'http';
import * as socketIo from 'socket.io';
import * as express from 'express';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as cors from 'cors';

import { analytics } from './analytics';
import { dashboard } from './dashboard';
import { chatbase } from './chatbase';
// import { chatconfig } from './chatconfig';
import { dialogflow } from './dialogflow';

dotenv.config();
sourceMapSupport.install();

const projectId = process.env.GCLOUD_PROJECT;
const langCode = process.env.LANGUAGE_CODE;
//const debug_mode = true;

console.log("Chatserver running...");

export class App {

  public static readonly PORT:number = 3000;
  private app: express.Application;
  private server: any;
  private io: SocketIO.Server;

  constructor() {
      this.createApp();
      this.createServer();
      this.sockets();
      this.listen();
  }

  private createApp(): void {
      this.app = express();
      this.app.use(cors());

      this.app.use(function(req: any, res: any, next: any) {
          res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
          next();
          console.log(req);
      });
      this.app.use('/', express.static(path.join(__dirname, '../')));
  }

  private createServer(): void {
      this.server = createServer(this.app);
  }

  private sockets(): void {
      this.io = socketIo(this.server);
  }

  private listen(): void {
      this.server.listen(App.PORT, () => {
          console.log('Running chat server on port %s', App.PORT);
          console.log(projectId);
      });

      this.io.on('connection', (client: any) => {

        client.on('welcome', (data: any) => {
          let queryInput = {};
          queryInput['event'] = {
            name: 'websitewelcome',
            languageCode: langCode
          }

          if(data){
            queryInput['event']['parameters'] = { user: data.username };
          }

          dialogflow.detectIntent(queryInput, function(result: any) {
            client.emit('agentmsg', {
              username: result.botName,
              message: result.botAnswer,
              confidence: result.confidence,
              session: client.id
            });
          });

        });

        client.on('msg', (txt: String) => {
            let queryInput = {};
            let timestamp = new Date().getTime();
              
            queryInput['text'] = {
              text: txt,
              languageCode: langCode
            }

            dialogflow.detectIntent(queryInput, function(result: any) {              
              client.emit('agentmsg', {
                username: result.botName,
                message: result.botAnswer,
                confidence: result.confidence,
                session: client.id
              });

              analytics.pushToChannel({
                text: txt,
                posted: timestamp,
                intent: result.botAnswer.toString(),
                //intentName: result.intentName,
                //isFallback: result.isFallback,
                //isFulfillment: result.isFulfillment,
                //isEndInteraction: result.isEndInteraction,
                confidence: result.confidence,
                session: client.id
              }, process.env.TOPIC);

              chatbase.logUserChatbase({
                text: txt,
                posted: timestamp.toString(),
                intentName: result.intentName,
                isFallback: result.isFallback,
                confidence: result.confidence,
                session: result.sessionId
              });

              chatbase.logBotChatbase({
                posted: timestamp.toString(),
                intent: result.botAnswer.toString(),
                confidence: result.confidence,
                session: result.sessionId
              });
            });
        });

        // client.on('typing', function () {
        // console.log("typing");
        // });

        client.on('dashboardload', () => {
            dashboard.load(function(data: Object) {
              client.emit('dashboarddata', data);
            });
        });

        client.on('getsession', (sessionId) => {
          dashboard.queryTranscript(sessionId, function(data: Object) {
            client.emit('dashboardsearch', data);
          });
      });

        client.on('disconnect', () => {
          console.log('Client disconnected');
      });
    });
  }

  public getApp(): express.Application {
      return this.app;
  }
}

export let app = new App();