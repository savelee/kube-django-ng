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
            `SELECT TEXT, INTENT, SESSION
            FROM ${datasetChatMessages}.${tableChatMessages} 
            WHERE CONFIDENCE IS NULL AND INTENT LIKE '%Sorry%' LIMIT 5`;
        this.queryNegatives = 
            `SELECT SCORE, TEXT, SESSION 
            FROM ${datasetChatMessages}.${tableChatMessages} 
            WHERE SCORE < 0 
            ORDER BY SCORE ASC LIMIT 5`;
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
                if(item[0][0]['totals']) {
                    totals = item[0][0]['totals'];
                } else if(item[0][0]['totalnegatives']){
                    totalNegatives = item[0][0]['totalnegatives'];
                } else if(item[0][0]['SCORE']){
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