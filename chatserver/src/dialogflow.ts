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

type actionObj = {
    action: string,
    param: { category: string }
}

type dialogflowResult = {
    botAnswer: Array<any>,
    isFulfillment: boolean,
    isFallback: boolean,
    isEndInteraction: boolean,
    intentName: string,
    sessionId: string,
    confidence: number,
    botName: string,
    platform?: string
}

export interface agentConfig {
    parent: string,
    agentContent: string
}

export interface queryInput {
    event?: {
        name: string,
        languageCode: string
        parameters?: object
    }
    text?: {
        text: string,
        languageCode: string
    }
}

export class Dialogflow {
    private sessionClient: df.v2beta1.sessionClient;
    private agentClient: df.v2beta1.agentClient;
    private intentClient: df.v2beta1.IntentsClient;
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
    }

    /**
     * Export Agent to Cloud Storage Bucket
     * @param {string} projectId of the Google Cloud Project
     * @param {string} bucket url
     * @return {Promise<void>}
     */
    public async exportAgent(projectId:string, bucketUri:string): Promise<any> {
        return this.agentClient.exportAgent({parent: 'projects/' + projectId,
            agentUri: bucketUri});
    }

    /**
     * Import Agent 
     * Import new intents and entities without deleting
     * @param {agentConfig} Dialogflow agent config
     * @return {Promise<void>}
     */
    public async importAgent(to: agentConfig):Promise<void> {
        return this.agentClient.importAgent(to);
    }

    /**
     * Restore (Replace) Dialogflow Agent with new one.
     * @param {agentConfig} Dialogflow agent config
     * @return {Promise<void>}
     */
    public async restoreAgent(to: agentConfig): Promise<void> {
        return this.agentClient.restoreAgent(to);
    }

    /**
     * Detect Intent based on queryInput.
     * @param {queryInput} queryInput 
     * @return {Promise<dialogflowResult>} bot results
     */
    public async detectIntent(queryInput: queryInput, environment?: string): Promise<dialogflowResult> {
        let botResult: Promise<dialogflowResult>;
        if (environment == 'test') {
            let sessionTestPath = this.sessionClient.sessionPath(
                this.testProjectId, this.sessionId); 
            botResult = this._detectIntent(queryInput, sessionTestPath);
        } else {
            let sessionPath = this.sessionClient.sessionPath(
                this.projectId, this.sessionId);
            botResult = this._detectIntent(queryInput, sessionPath);
        }
        return botResult;
    }

    /**
     * Detect Intent based on queryInput.
     * @param {queryInput} queryInput 
     * @return {Promise<dialogflowResult>} bot results
     */
    public async _detectIntent(queryInput: queryInput, sessionPath: df.v2beta1.sessionPath): Promise<dialogflowResult> {
        let request = {
            session: sessionPath,
            queryInput: queryInput
        }

        return new Promise((resolve, reject) => {
           this.sessionClient.detectIntent(request).then(responses => {
                let result = responses[0];
                resolve(this._getBotResults(result));
           }).catch(err => {
               reject(err)
           });
        });
    }

    /**
     * Retrieve all intents from Test Dialogflow Agent
     * @param {string} (optional) languageCode 
     * @return {Promise<any>} JSON object with intents
     */
    public async getAllTestIntents(languageCode?: string): Promise<any> {
        const formattedParent = this.intentClient.projectAgentPath(this.testProjectId);
        return this.intentClient.listIntents({
            parent: formattedParent,
            languageCode: languageCode,
            intentView : 'INTENT_VIEW_FULL'
        });
    }

    /**
     * Get Test Agent based on testProjectId
     * @return {Promise<any}
     */
    public async getTestAgents(): Promise<any> {
        const formattedParent = this.agentClient.projectPath(this.testProjectId);
        return this.agentClient.getAgent({parent: formattedParent});
    }

    /**
     * Get Intent by formatted name
     * @param {string} formattedName
     * @return {Promise<any}
     */
    public async getIntent(formattedName: string): Promise<any>  {
        return this.intentClient.getIntent({name: formattedName});
    }

    /**
     * Return a formatted bot result from
     * a Dialogflow JSON response
     * @param {object} Dialogflow response
     * @return {dialogflowResult} botResult 
     */
    private _getBotResults(result: object): dialogflowResult {
        result = result['queryResult'];

        let botResults : dialogflowResult = {
            botAnswer: new Array(),
            isFulfillment: false,
            isFallback: false,
            isEndInteraction: false,
            intentName: '',
            sessionId: this.sessionId,
            confidence: result['intentDetectionConfidence'],
            botName: 'Chatbot'
        };

        if (result['webhookStatus']) {
            botResults['isFulfillment'] = true;
        }

        if (result['intent']) {
            botResults['isFallback'] = result['intent'].isFallback;
            botResults['intentName'] = result['intent'].displayName;
            botResults['isEndInteraction'] = result['intent'].endInteraction;
        }

        // get special actions
        if (result['action'] === 'spent' || result['action'] === 'income') {
            var p = structJson.structProtoToJson(result['parameters']);

            botResults['botName'] = 'BalanceBot';
            if (result['action'] === 'spent') {
                let spentObj: actionObj = {
                    action: 'spent',
                    param: p['category']
                }
                botResults['botAnswer'].push(spentObj); //TODO this will break as its an array
            }
            if (result['action'] === 'income') {
                let incomingObj: actionObj = {
                    action: 'income',
                    param: p['category']
                }
                botResults['botAnswer'].push(incomingObj); //TODO this will break as its an array
            }
        } else {
            // get dialogs
            let dialogs = result['fulfillmentMessages'];
            for (let i = 0, len = dialogs.length; i < len; i++) {
                let messageType = dialogs[i].message; // text || payload
                let answer = '';

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
                    else if (custom.type === 'thumb') {
                        answer = `<img src="${custom.image}" width="100"/><a href="${custom.link}" target="_blank">${custom.text}</a>`;
                        botResults['botAnswer'].push(answer);
                    }
                    // map
                    else if (custom.type === 'map') {
                        answer = `<iframe src="${custom.link}" width="400" height="225" frameborder="0" style="border:0" allowfullscreen></iframe>`;
                        botResults['botAnswer'].push(answer);
                    }
                } else {
                    if (dialogs[i]['text']) {
                        answer = dialogs[i]['text'].text;
                        botResults['botAnswer'].push(answer);
                    }
                }
            }
        }
        
        return botResults;
    }

}

export let dialogflow = new Dialogflow();