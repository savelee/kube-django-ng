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
import * as http from 'http';
import * as socketIo from 'socket.io';
import * as express from 'express';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as cors from 'cors';

import { analytics } from './analytics';
import { dashboard } from './dashboard';
import { chatbase } from './chatbase';
import { acceptance } from './acceptance';;
import { dialogflow } from './dialogflow';
// import { chatconfig } from './chatconfig'
dotenv.config();
sourceMapSupport.install();

const projectId = process.env.GCLOUD_PROJECT;
const langCode = process.env.LANGUAGE_CODE;
//const debug_mode = true;

console.log("Chatserver running...");

export class App {

  public static readonly PORT:number = 3000;
  private app: express.Application;
  private server: http.Server;
  private io: SocketIO.Server;
  public testIntents: [];
  public testSupportedLanguages: string[];

  constructor() {
    let me = this;
    this.createApp();
    this.createServer();
    this.sockets();
    this.listen();

    dialogflow.getAllTestIntents().then(results => {
      this.testIntents = results;
    });

    me.testSupportedLanguages = [];
    dialogflow.getTestAgents().then(agents => {
      this.testSupportedLanguages = agents[0].supportedLanguageCodes;
      me.testSupportedLanguages.push(agents[0].defaultLanguageCode)
    });
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
      this.server = http.createServer(this.app);
  }

  private sockets(): void {
      console.log(this.server);
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

          dialogflow.detectIntent(queryInput).then(result => {
            client.emit('agentmsg', {
              username: result['botName'],
              message: result['botAnswer'],
              confidence: result['confidence'],
              session: client['id']
            });
          });

        });

        client.on('msg', (txt: String, platform: string) => {
          let queryInput = {};
          let timestamp = new Date().getTime();
            
          queryInput['text'] = {
            text: txt,
            languageCode: langCode
          }

          dialogflow.detectIntent(queryInput).then(result => {              
            client.emit('agentmsg', {
              username: result['botName'],
              message: result['botAnswer'],
              confidence: result['confidence'],
              session: client['id']
            });

            analytics.pushToChannel({
              text: txt,
              posted: timestamp,
              platform: platform,
              botName: result['botName'],
              intentResponse: result['botAnswer'].toString(),
              intentName: result['intentName'],
              isFallback: result['isFallback'],
              isFulfillment: result['isFulfillment'],
              isEndInteraction: result['isEndInteraction'],
              confidence: result['confidence'],
              session: client['id']
            }, process.env.TOPIC);

            chatbase.logUserChatbase({
              text: txt.toString(),
              posted: timestamp.toString(),
              platform: platform,
              intentName: result['intentName'],
              isFallback: result['isFallback'],
              session: client['id']
            });

            chatbase.logBotChatbase({
              posted: timestamp.toString(),
              platform: platform,
              intentResponse: result['botAnswer'].toString(),
              session: client['id']
            });
          }).catch(err => {
            console.log(err);
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

        client.on('acceptanceInput', (methodName, item) => {
          client.emit('loadIntents', this.testIntents);
          client.emit('loadSupportedLanguages', this.testSupportedLanguages);

          switch (methodName) {
            case 'deployDevToTest':
              acceptance.deployDevToTest();
              break;
            case 'deployTestToProduction':
              acceptance.deployTestToProduction();
              break;
            case 'rollback':
              acceptance.rollback();
              break;
            case 'loadUserPhrases':
              if (item && item['name']) {
                acceptance.fetchUserPhrases(item['name'], function(result) {
                  client.emit('loadUserPhrases', result);
                });
              }
              break;
            case 'addTestCase':
              acceptance.addExecTestCase(item).then(result => {
                client.emit('testResultOutput', result );
              }).catch(e => {
                console.error(e);
              });
              break;
            case 'runDiff':
              acceptance.runDiff(function(changes){
                client.emit('acceptanceOutput', changes);
              });
              break;
          }
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