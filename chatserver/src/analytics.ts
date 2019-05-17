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

import { BigQuery } from '@google-cloud/bigquery';
import { PubSub } from '@google-cloud/pubsub';
import * as dotenv from 'dotenv';

dotenv.config();

const pubsub = new PubSub({
    projectId: process.env.GCLOUD_PROJECT
});

const bigquery = new BigQuery({
    projectId: process.env.GCLOUD_PROJECT
});

const id = process.env.GCLOUD_PROJECT;

const datasetChatMessages = process.env.DATASET;
const tableChatMessages = process.env.TABLE;
// tslint:disable-next-line:no-suspicious-comment
// TODO add schema for TP,TN,FP,FN,ACCURACY,PRESISION,RECALL,F1
const schemaChatMessages = 'TEXT, POSTED:TIMESTAMP, SCORE:FLOAT, MAGNITUDE:FLOAT, INTENT, CONFIDENCE:FLOAT, SESSION';
const topicChatbotMessages = process.env.TOPIC;


export class Analytics {

    constructor() {
        this.setupBigQuery(datasetChatMessages, 
            tableChatMessages, schemaChatMessages);
        
        this.setupPubSub(topicChatbotMessages);
    }

    /**
     * If dataset doesn't exist, create one.
     * If table doesn't exist, create one.
     * @param {string} bqDataSetName BQ Dataset name
     * @param {string} bqTableName BQ Table name 
     * @param {string} schema BQ table schema  
     */
    public setupBigQuery(bqDataSetName: string, bqTableName: string, schema: string) {
        const dataset = bigquery.dataset(bqDataSetName);
        const table = dataset.table(bqTableName);

        dataset.exists(function(err: any, exists: any) {
            if (err) console.error('ERROR', err);
            if (!exists) {
                    dataset.create({
                    id: bqDataSetName
                }).then(function() {
                    console.log("dataset created");
                    // If the table doesn't exist, let's create it.
                    // Note the schema that we will pass in.
                    table.exists(function(err: any, exists: any) {
                        if (!exists) {
                            table.create({
                                id: bqTableName,
                                schema: schema
                            }).then(function() {
                                console.log("table created");
                            });
                        } else {
                            console.error('ERROR', err);
                        }
                    });
                });
            }
        });


        table.exists(function(err: any, exists: any) {
            if (err) console.error('ERROR', err);
            if (!exists) {
                table.create({
                    id: bqTableName,
                    schema: schema
                }).then(function() {
                    console.log("table created");
                });
            }
        });
    }

    /**
     * If topic is not created yet, please create.
     * @param {string} topicName PubSub Topic Name
     */
    public setupPubSub(topicName: string) {
        const topic = pubsub.topic(`projects/${id}/topics/${topicName}`);
        topic.exists((err: any, exists: any) => {
            if (err) console.error('ERROR', err);
            if (!exists) {
                pubsub.createTopic(topicName).then(results => {
                    console.log(results);
                    console.log(`Topic ${topicName} created.`);
                })
                .catch(err => {
                    console.error('ERROR:', err);
                });
            }
        });
    }

    /**
     * Execute Query in BigQuery
     * @param {string} sql SQL Query
     */
    public queryBQ(sql: string) {
        return new Promise(function(resolve: Function, reject: Function) {
            if (sql) {
                bigquery.query(sql).then(function(data: any) {
                    resolve(data);
                });
            } else {
                reject("ERROR: Missing SQL");
            }
        });
    }

    /**
     * Push to PubSub Channel
     * @param {Object} json JSON Object
     */
    public async pushToChannel(json: Object, topicName:string) {
        const topic = pubsub.topic(`projects/${id}/topics/${topicName}`);
        let dataBuffer = Buffer.from(JSON.stringify(json), 'utf-8');

        const messageId = await topic.publish(dataBuffer);
        console.log(`Message ${messageId} published to topic: ${topicName}`);
    }

}

export let analytics = new Analytics();