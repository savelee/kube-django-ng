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

import * as dotenv from 'dotenv';
import { analytics } from './analytics';

dotenv.config();

const datasetChatMessages = process.env.DATASET;
const tableChatMessages = process.env.TABLE;

export class Dashboard {
    private queryCountTotals: string;
    private queryNegativesTotals: string;
    private queryImproveBot: string;
    private queryNegatives: string;

    constructor() {
        this.queryCountTotals = 
            `SELECT COUNT(TEXT) AS totals 
            FROM ${datasetChatMessages}.${tableChatMessages}`;
        this.queryNegativesTotals = 
            `SELECT COUNT(TEXT) AS totalnegatives 
            FROM ${datasetChatMessages}.${tableChatMessages} WHERE SCORE < 0`;
        this.queryImproveBot = 
            `SELECT TEXT, INTENT_RESPONSE, INTENT_NAME, SESSION 
            FROM ${datasetChatMessages}.${tableChatMessages} 
            WHERE IS_FALLBACK = true ORDER BY TEXT ASC LIMIT 8`;
        this.queryNegatives = 
            `SELECT SCORE, TEXT, SESSION 
            FROM ${datasetChatMessages}.${tableChatMessages} 
            WHERE SCORE < 0 
            ORDER BY SCORE ASC LIMIT 8`;
    }

    /**
     * Load Dashboard
     * @param {Function} cb Callback once data is queried from BQ.
     */
    public load(cb: Function) {
        console.log('load dashboard');

        Promise.all([
            analytics.queryBQ(this.queryCountTotals),
            analytics.queryBQ(this.queryNegativesTotals),
            analytics.queryBQ(this.queryImproveBot),
            analytics.queryBQ(this.queryNegatives)     
        ]).then(function(values: any) {
            let negatives = [], unhandled = [], totalNegatives = 0, totals = 0;
            let data = {};

            values.forEach(function(item: any){
                if(item && item[0] && item[0][0] && item[0][0]['totals']) {
                    totals = item[0][0]['totals'];
                } else if(item && item[0] && item[0][0] && item[0][0]['totalnegatives']){
                    totalNegatives = item[0][0]['totalnegatives'];
                } else if(item && item[0] && item[0][0] && item[0][0]['SCORE']){
                    negatives.push(item[0]);
                } else {
                    unhandled.push(item[0]);
                }
            });

            data['totals'] = totals;
            data['totalNegatives'] = totalNegatives;
            data['negatives'] = negatives;
            data['unhandled'] = unhandled;
            cb(data);

        }).catch(function(err: string) {
            console.error('ERROR', err);
        });
    }

    /**
     * Query Chatbot Transcript based on Session ID
     * @param {string} sessionId Dialogflow Session ID
     * @param {Function} cb Callback once data is queried from BQ.
     */
    public queryTranscript(sessionId: string, cb: Function) {
        let queryTranscript = `SELECT * FROM ${datasetChatMessages}.${tableChatMessages} WHERE SESSION = '${sessionId}' ORDER BY POSTED`;
        let transcript = [];
        Promise.all([
            analytics.queryBQ(queryTranscript)
        ]).then(function(values: any) {
            values.forEach(function(item: any){
                transcript.push(item[0]);
            });
            cb(transcript);
        });
    }
}

export let dashboard = new Dashboard();