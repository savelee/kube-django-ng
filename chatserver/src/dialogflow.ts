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
    private sessionClient: df.v2beta1.sessionClient;
    private agentClient: df.v2beta1.agentClient;
    private intentClient: df.v2beta1.IntentsClient;
    private sessionPath: df.v2beta1.sessionClient.sessionPath;
    private projectId: string;
    private testProjectId: string;
    private sessionId: string;

    constructor() {
        this.projectId = process.env.GCLOUD_PROJECT;
        this.testProjectId = process.env.TEST_AGENT_PROJECT_ID;
        this.sessionId = uuid.v4();
        this.agentClient = new df.v2beta1.AgentsClient();
        this.sessionClient = new df.v2beta1.SessionsClient();
        this.intentClient = new df.v2beta1.IntentsClient();
        this.sessionPath = this.sessionClient.sessionPath(
            this.projectId, this.sessionId);  
    }

    public async exportAgent(projectId:string, bucket) {
        return this.agentClient.exportAgent({parent: 'projects/' + projectId,
            agentUri: bucket});
    }

    public async importAgent(to: Object) {
        return this.agentClient.importAgent(to);
    }

    public async restoreAgent(to: Object) {
        return this.agentClient.restoreAgent(to);
    }

    public async detectIntent(queryInput:any, cb:Function) {
        let request = {
            session: this.sessionPath,
            queryInput: queryInput
        }
        const responses = await this.sessionClient.detectIntent(request);
        // console.log(responses);
        let result = responses[0];

        if(result) {
           cb(this.getBotResults(result));
        } else {
            console.log('something went wrong with the response');
        }
    }

    public async getAllTestIntents(languageCode?: string) {
        const formattedParent = this.intentClient.projectAgentPath(this.testProjectId);
        return this.intentClient.listIntents({
            parent: formattedParent,
            languageCode: languageCode,
            intentView : 'INTENT_VIEW_FULL'
        });
    }

    public async getTestAgents() {
        const formattedParent = this.agentClient.projectPath(this.testProjectId);
        return this.agentClient.getAgent({parent: formattedParent});
    }

    public async getIntent(formattedName: string) {
        return this.intentClient.getIntent({name: formattedName});
    }

    public getBotResults(result: any) {
        let botResults = {};
        if (result.webhookStatus) {
            botResults['isFulfillment'] = true;
        } else {
            botResults['isFulfillment'] = false;
        }
        result = result.queryResult;
        botResults['botAnswer'] = [];
        botResults['sessionId'] = this.sessionId;
        botResults['confidence'] = result.intentDetectionConfidence;        
  
        if (result.intent) {
            botResults['isFallback'] = result.intent.isFallback;
            botResults['intentName'] = result.intent.displayName;
            botResults['isEndInteraction'] = result.intent.endInteraction;
        } else {
            botResults['isFallback'] = false;
            botResults['isEndInteraction'] = false;
            botResults['intentName'] = '';
        }

        // get special actions
        if (result.action === 'spent' || result.action === 'income') {
            var p = structJson.structProtoToJson(result.parameters);

            botResults['botName'] = 'BalanceBot';
            if (result.action === 'spent') {
                let spentObj = {
                    action: 'spent',
                    param: p['category']
                }
                botResults['botAnswer'] = spentObj;
            }
            if (result.action === 'income') {
                let incomingObj = {
                    action: 'income',
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