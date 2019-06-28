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
import { dialogflow } from './dialogflow';
import { analytics } from './analytics';
import { Storage } from '@google-cloud/storage';
import { FileDirectory } from "./set";
import * as unzip from 'unzipper';

dotenv.config();

const datasetTestMetrics = process.env.DATASET_TEST_METRICS;
const tableTestMetrics = process.env.TABLE_TEST_METRICS;

export interface queryRow {
    TEST_DATE: number,
    TEST_QUERY: string,
    TEST_LANGUAGE: string,
    DETECTED_INTENT: string,
    EXPECTED_INTENT: string,
    IS_FALLBACK: boolean
}

/**
 * Environment Class
 * @param {string} name - Name of the environment
 * @param {string} projectId - Google Cloud project id
 */
export class Environment {
    private name: string;
    private projectId: string;
    constructor(name: string, projectId: string) {
        this.name = name;
        this.projectId = projectId;
    }
}

/**
 * Acceptance Class
 * Create the Acceptance Environment
 */
export class Acceptance {
    private dev: Environment;
    private test: Environment;
    private prod: Environment;
    private storage: Storage;
    private bucket: string;
    private fileDate: string;
   
    constructor() {
        this.dev = new Environment('devAgent', 
            process.env.DEV_AGENT_PROJECT_ID);
        this.test = new Environment('testAgent',
            process.env.TEST_AGENT_PROJECT_ID);
        this.prod = new Environment('prodAgent',
            process.env.GCLOUD_PROJECT);
        this.bucket = process.env.GCLOUD_STORAGE_BUCKET_NAME;

        this.storage = new Storage();
        this._setupBucket();
        this._setFileDate();
    }

    /**
     * Deploy Dev Dialogflow agent to Test agent
     */
    public deployDevToTest(): Promise<void> {
        return this._deployAgentToAgent(this.dev, this.test);
    }

    /**
     * Deploy Test Dialogflow agent to Production agent
     */
    public deployTestToProduction(): Promise<void> {
        return this._deployAgentToAgent(this.test, this.prod);
    }

    /**
     * Rollback Production Dialogflow agent to Test agent
     */
    public rollback(): Promise<void>{
        return this._deployAgentToAgent(this.prod, this.test);
    }

    /**
     * Find the Differences between Dev and Test
     * environment.
     * @param {Function} cb - Callback function to execute.
     */
    public async runDiff(cb: Function): Promise<void> {
        return this._runDiff(this.test, this.prod).then((changes)=> {
            cb(changes);
        });
    }

    /**
     * Fetch Dialogflow Model Training Phrases
     * that belongs to an intent, execute callback
     * function and pass in array with phrases.
     * @param {string} fileName - the intent file name.
     * @param {Function} cb - Callback function to execute.
     */
    public fetchUserPhrases(intentName: string, cb: Function): void {
        if (!intentName) return;
        intentName = intentName.replace('intents/', '');
        let languageCode = intentName.split('_usersays_')[1];
        let intentNameShort = intentName.split('_usersays_')[0];

        dialogflow.getAllTestIntents(languageCode).then(responses => {
            const intents = responses[0];
            for (let intent of intents) {
                if (intent.displayName == intentNameShort) {
                    let userphrases = intent.trainingPhrases;
                    let phrases = [];
                    for (let phrase of userphrases) {
                        let texts = [];
                        for (let part of phrase.parts) {
                            texts.push(part.text);
                        }
                        phrases.push(texts.join(' '));
                    }
                    cb(phrases);
                    return;
                }
            }
        });
    }

    /**
     * Add & Execute TestCase
     * @param {queryRow} row
     * @return {Promise<queryRow>} resultsRow new row with test results
     */
    public async addExecTestCase(row: queryRow): Promise<queryRow> {
        return new Promise((resolve, reject) => {
            this._runTestForMetrics(row).then((resultsRow) => {
                analytics.insertInBQ(datasetTestMetrics, tableTestMetrics, resultsRow).then(() => {
                    resolve(resultsRow);
                });
            }).catch(e => { reject(e) });
        });
    }


    /**
     * Run test to get metrics
     * Detect Intent based on queryRow.TEST_QUERY
     * Figure out if its a True Positive, True Negative
     * False Positive or False Negative
     * 
     * TP - Test Query = Expected Query
     * TN - Test Query = Expected Fallback
     * FP - Test Query != Expected Query
     * FN - Test Query != Expected Query but Fallback
     *  
     * @param {queryRow} row 
     * @returns {Promise<queryRow} resultRow - queryRow which includes results
     */
    private async _runTestForMetrics(row: queryRow): Promise<queryRow> {
        let queryInput = {};
        queryInput['text'] = {
            text: row['TEST_QUERY'],
            languageCode: row['TEST_LANGUAGE']
        }
        
        return new Promise((resolve, reject) => {
            dialogflow.detectIntent(queryInput, 'test').then(botResults => {
                
                row['DETECTED_INTENT'] = botResults['intentName'];
                row['IS_FALLBACK'] = botResults['isFallback'];

                if (row['EXPECTED_INTENT'] === row['DETECTED_INTENT'] 
                    && row['IS_FALLBACK'] === false) {
                        row['TEST_RESULT'] = 'TP';
                } else if (row['EXPECTED_INTENT'] === row['DETECTED_INTENT']
                    && row['IS_FALLBACK'] === true) {
                        row['TEST_RESULT'] = 'TN';
                } else if (row['EXPECTED_INTENT'] !== row['DETECTED_INTENT'] 
                    && row['IS_FALLBACK'] === false) {
                        row['TEST_RESULT'] = 'FP';
                } else if (row['EXPECTED_INTENT'] !== row['DETECTED_INTENT'] 
                    && row['IS_FALLBACK'] === true) {
                        row['TEST_RESULT'] = 'FN';
                }

                resolve(row);
            }).catch(err => {
                reject(err);
                console.log(err);
            });
        });
    }

    /**
     * Create Storage Bucket when it doesn't exists.
     * @return {Promise<void>}
     */
    private async _setupBucket(): Promise<void> {
        let me = this;
        return this.storage.bucket(this.bucket).exists().then(function(data) {
            const exists = data[0];
            if (exists === false) {
                me.storage.createBucket(me.bucket).then(() => {
                    console.log(`Bucket ${me.bucket} is created.`);
                });
            }   
          });
    }
    
    /**
     * Deploy From one Dialogflow Agent to another Dialogflow Agent
     * Run Difference, Zip it and import in the other agent.
     * @param {Environment} from  - Download to file system from Dialogflow Agent
     * @param {Environment} to - Download to file system to Dialogflow Agent
     * @return {Promise<void>} - Import in the other agent.
     */
    private async _deployAgentToAgent(from: Environment, to: Environment): Promise<void> {
        // create versions based on date
        this._setFileDate();

        // download from files in gcs, to have a dev version to upload
        await this._exportAgent(from);
        
        // path to zip on GCS
        const remoteFile = `gs://${this.bucket}/${from['name']}-${this.fileDate}.zip`;
        
        dialogflow.restoreAgent(remoteFile, to['projectId']).then(() => {
            console.log(`Done Importing`);
        });
    }

    /**
     * Set nice file date YYYY-MM-DD-HH-MM
     */
    private _setFileDate(): void {
        let dateObj = new Date(),
        month = dateObj.getUTCMonth() + 1,
        day = dateObj.getUTCDate(),
        year = dateObj.getUTCFullYear(),
        hours = dateObj.getUTCHours(),
        min = dateObj.getUTCMinutes();

        this.fileDate = `${year}-${month}-${day}-${hours}-${min}`;
    }

    /**
     * Compare 2 environment folders on the file system
     * @param {Environment} from 
     * @param {Environment} to 
     * @return {Promise<FileDirectory>} changes FileDirectory Set
     */
    private async _runDiff(from: Environment, to: Environment): Promise<FileDirectory> {
        // download test zip in gcs
        await this._exportAgent(from);
        // download prod zip in gcs to compare
        await this._exportAgent(to);

        return new Promise(async (resolve, _reject) => {
            let fromDir = new FileDirectory();
            const [filesFrom] = await this.storage.bucket(this.bucket).getFiles({ prefix: `${from['name']}/` });
            let toDir = new FileDirectory();
            const [filesTo] = await this.storage.bucket(this.bucket).getFiles({ prefix: `${to['name']}/` });

            filesFrom.forEach(file => {
                if (file.name.indexOf('.zip') == -1 && file.name.indexOf('package.json') == -1){
                    let newName = file.metadata.name.replace(`${from['name']}/`, '').replace('.json', '');
                    fromDir.add({
                        name: newName,
                        size: parseInt(file.metadata.size)
                    });
                }
            });
    
            filesTo.forEach(file => {
                if (file.name.indexOf('.zip') == -1 && file.name.indexOf('package.json') == -1){
                    let newName = file.metadata.name.replace(`${to['name']}/`, '').replace('.json', '');
                    toDir.add({
                        name: newName,
                        size: parseInt(file.metadata.size)
                    });
                }
            });

            let differences = fromDir.diff(toDir);

            resolve(differences);
        });        
    }

    /**
     * Export agent from destination to file system
     * @param {Environment} from
     * @return {Promise<any>}
     */
    private async _exportAgent(from: Environment): Promise<any> {
        let fileName = `${from['name']}-${this.fileDate}.zip`;
        const remoteFile = this.storage.bucket(this.bucket).file(`${fileName}`)
    
        return dialogflow.exportAgent(from['projectId'], `gs://${this.bucket}/${fileName}`)
          .then(responses => {
            const [operation] = responses;
            // Operation#promise starts polling for the completion of the LRO.
            console.log(`Export ${fileName} to gs://${this.bucket}.`);
            return operation.promise();
          })
          .then(() => {
            return new Promise((resolve, reject) => {
                console.log(`Unzipping to GCS gs://${this.bucket}/${fileName}`);
                remoteFile.createReadStream()
                .on('error', err => {
                    console.error(err);
                    reject(err);
                })
                .on('end', () => {
                    console.log(`Finished unpacking files in gs://${this.bucket}/${fileName}`)
                    resolve();
                })
                .pipe(unzip.Parse())
                .on('entry', entry => {
                    const file = this.storage.bucket(this.bucket).file(`${from['name']}/${entry.path}`)
                    entry.pipe(file.createWriteStream())
                    .on('error', err => {
                        console.log(err);
                    })
                    .on('finish', () => {
                        //console.log(`Finsihed extracting ${from['name']}/${entry.path}`)
                    });
                    entry.autodrain();
                });
            });
          })
          .catch(err => {
            console.error(err);
          });
    }
}

export let acceptance = new Acceptance();