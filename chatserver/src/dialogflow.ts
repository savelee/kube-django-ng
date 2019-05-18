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

import * as df from 'dialogflow';
import * as dotenv from 'dotenv';
import * as uuid from 'uuid';

const structJson = require('./structjson');

dotenv.config();

export class Dialogflow {
    private sessionClient: any;
    private sessionPath: any;
    private projectId: string;
    private sessionId: string;

    constructor() {
        this.projectId = process.env.GCLOUD_PROJECT;
        this.sessionId = uuid.v4();
        this.sessionClient = new df.v2beta1.SessionsClient();
        this.sessionPath = this.sessionClient.sessionPath(
            this.projectId, this.sessionId);
    }

    public async detectIntent(queryInput:any, cb:Function) {
        let request = {
            session: this.sessionPath,
            queryInput: queryInput
        }
        const responses = await this.sessionClient.detectIntent(request);
        let result = responses[0].queryResult;

        if(result) {
           cb(this.getBotResults(result));
        } else {
            console.log('something went wrong with the response');
        }
        
    }

    public getBotResults(result: any) {
        let botResults = {};
        // console.log(result);

        botResults['botAnswer'] = [];
        botResults['sessionId'] = this.sessionId;
        botResults['confidence'] = result.intentDetectionConfidence;        
  
        if (result.intent) {
            botResults['isFallback'] = result.intent.isFallback;
            botResults['intentName'] = result.intent.displayName;
        } else {
            botResults['isFallback'] = false;
            botResults['intentName'] = '';
        }

        // get special actions
        if (result.action === 'spent' || result.action === 'income') {
            var p = structJson.structProtoToJson(result.parameters);

            botResults['botName'] = 'BalanceBot';
            if (result.action === 'spent') {
                let spentObj = {
                    name: 'spent',
                    param: p['category']
                }
                botResults['botAnswer'] = spentObj;
            }
            if (result.action === 'income') {
                let incomingObj = {
                    name: 'salary',
                    param: p['category']
                }
                botResults['botAnswer'] = incomingObj;
            }
        } else {
            // get dialogs
            let dialogs = result.fulfillmentMessages;
            for (let i = 0, len = dialogs.length; i < len; i++) {
                let messageType = dialogs[i].message; // text || payload
                let answer = '';
                botResults['botName'] = 'Chatbot';

                // in case of custom payload
                if (messageType === 'payload') {
                    let custom = structJson.structProtoToJson(dialogs[i]["payload"])["web"];
                    console.log(custom);
                    // hyperlink
                    if (custom.type === 'hyperlink') {
                        answer = `<a href="${custom.link}" target="_blank">${custom.text}</a>`;
                        botResults['botAnswer'].push(answer);
                    }
                    // thumbnail
                    else if (custom.type === "thumb") {
                        answer = `<img src="${custom.image}" width="100"/><a href="${custom.link}" target="_blank">${custom.text}</a>`;
                        botResults['botAnswer'].push(answer);
                    }
                    // map
                    else if (custom.type === "map") {
                        answer = `<iframe src="${custom.link}" width="400" height="225" frameborder="0" style="border:0" allowfullscreen></iframe>`;
                        botResults['botAnswer'].push(answer);
                    }
                } else {
                    if (dialogs[i]["text"]) {
                        answer = dialogs[i]["text"].text;
                        botResults['botAnswer'].push(answer);
                    }
                }
            }
        }
        
        return botResults;
    }

}

export let dialogflow = new Dialogflow();