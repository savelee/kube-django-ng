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
import { exec } from 'child_process';
import { dialogflow } from './dialogflow';
import { analytics } from './analytics';
import { Storage } from '@google-cloud/storage';
import { compare, Options } from "dir-compare";
import * as fs from 'fs';

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
    private directory: string;
    private bucket: string;
    private fileDate: string;
   
    constructor() {
        this.dev = new Environment('devAgent', 
            process.env.DEV_AGENT_PROJECT_ID);
        this.test = new Environment('testAgent',
            process.env.TEST_AGENT_PROJECT_ID);
        this.prod = new Environment('prodAgent',
            process.env.GCLOUD_PROJECT);
        
        this.directory = 'tmp/';
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
        return this._rollback(this.prod, this.test);
    }

    /**
     * Rollback Dev Dialogflow agent to Test agent
     */
    public rollbackDev(): Promise<void>{
        return this._rollback(this.dev, this.test);
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
    public fetchUserPhrases(fileName: string, cb: Function): void {
        if (!fileName) return;
        let intentName = fileName.replace('/','').replace('.json', '');
        let languageCode = intentName.split('_usersays_')[1];
        let intentNameShort = intentName.split('_usersays_')[0];

        console.log(intentNameShort);

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
        this._setFileDate();

        // run a diff
        this._runDiff(from, to).then(changes => {
            this._makeZip(changes, to).then((path) => {
                this._importAgent(path, to).then(() => {
                    console.log(`Done Importing`);
                });
            });
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
     * Rollback environments from one agent to another
     * @param {Environment} from agent 
     * @param {Environment} to destination agent
     * @return {Promise<void>}
     */
    private async _rollback(from: Environment, to: Environment): Promise<void> {
        this._setFileDate();

        // download prod files
        await this._exportAgent(from);
        // download testAgent files
        await this._exportAgent(to);

        let zipPath = `${this.directory}${from['name']}-${this.fileDate}.zip`;

        return new Promise((resolve, reject) => {
            console.log(`Reading ${zipPath}`);
            fs.readFile((zipPath), (err, data) => {
              if (err) reject(err);
              else resolve(data);
            });
        }).then(data => {
          console.log(`Restoring ${from['name']} to ${to['projectId']}`);
          return dialogflow.restoreAgent({
            parent: 'projects/' + to['projectId'],
            agentContent: (data as Buffer).toString('base64')
        });
        }).catch(err => {
          console.error(err);
        });
    }


    /**
     * Compare 2 environment folders on the file system
     * @param {Environment} from 
     * @param {Environment} to 
     * @return {Promise<object[]>} changes array
     */
    private async _runDiff(from: Environment, to: Environment): Promise<object[]> {

        // download devAgent files
        await this._exportAgent(from);
        // download testAgent files
        await this._exportAgent(to);

        let path1 = `${this.directory}${from['name']}`;
        let path2 = `${this.directory}${to['name']}`;
        let options: Partial<Options> = {
            compareSize: true,
            compareContent: true,
            excludeFilter: 'agent.json,package.json' 
        };
        
        return compare(path1, path2, options).then(res => {
            let changes = [], i = 0;
            for (i; i < res.diffSet.length; i++) {
                if (res.diffSet[i].state !== 'equal' && 
                    res.diffSet[i].state !== 'distinct')
                {
                    changes.push(res.diffSet[i]);
                }
            }
            return changes;
        })
    }

    /**
     * Build the zip to upload to Dialogflow
     * First create a temp prepare folder.
     * Then copy files over from the destination folder
     * to the prepare folder. Then zip it to newAgent.zip.
     * @param {object[]} changeList - array with change objects
     * @param {Environment} destination - to environment
     * @return {Promise<any>} - make the zip
     */
    private async _makeZip(changeList: object[], destination: Environment): Promise<any> {
        let i = 0;
        let folder = `${this.directory}prepare`;
        
        return new Promise((resolve, reject) => {
            console.log('Create a temp folder.');
            exec(`rm -rf ${folder} && mkdir ${folder} && mkdir ${folder}/entities && mkdir ${folder}/intents`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        }).then(() => {
            return new Promise((resolve, reject) => {
                console.log(`Copy new files to ${folder}`);
                for (i; i < changeList.length; i++) {
                    if (changeList[i]['path1']) {
                        if (changeList[i]['name1'] !== '.DS_Store') {
                            let name = changeList[i]['name1'].replace(/ /g,"\\ ");
                            exec(`cp ./${changeList[i]['path1']}/${name} ${folder}${changeList[i]['relativePath']} && cp ./tmp/${destination['name']}/agent.json ${folder} && cp ./tmp/${destination['name']}/package.json ${folder}`, (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        }
                    } else {
                        // TODO intent will need to be removed.
                        // dialogflow.removeIntent();
                    }
                }
            });
        }).then(() => {
            return new Promise((resolve, reject) => {
                console.log(`Zipping newAgent.zip`);
                exec(`cd ${folder}; zip -r newAgent.zip *`, (err) => {
                    if (err) reject(err);
                    else resolve(`${folder}/newAgent.zip`);
                });
            });
        }).catch(err => {
            console.error(err);
        });
    }

    /**
     * Import Agent from a certain path to the destination environment.
     * @param {string} zipPath 
     * @param {Environment} to destination
     * @return {Promise<void>}
     */
    private _importAgent(zipPath: string, to: Environment): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(`Reading ${zipPath}`);
            fs.readFile((zipPath), (err, data) => {
              if (err) reject(err);
              else resolve(data);
            });
        }).then(data => {
          console.log(`Importing project to ${to['projectId']}`);
          return dialogflow.importAgent({
            parent: 'projects/' + to['projectId'],
            agentContent: (data as Buffer).toString('base64')
          });
        }).catch(err => {
          console.error(err);
        });
    }

    /**
     * Export agent from destination to file system
     * @param {Environment} from
     * @return {Promise<any>}
     */
    private async _exportAgent(from: Environment): Promise<any> {
        let fileName = `${from['name']}-${this.fileDate}.zip`;
        
        return dialogflow.exportAgent(from['projectId'], `gs://${this.bucket}/${fileName}`)
          .then(responses => {
            const [operation] = responses;
            // Operation#promise starts polling for the completion of the LRO.
            console.log(`Export ${fileName} to gs://${this.bucket}.`);
            return operation.promise();
          })
          .then(() => {
                const options = {
                    // The path to which the file should be downloaded, e.g. "./file.txt"
                    destination: `${this.directory}${fileName}`,
                };
                console.log(`Download ${fileName} to ${options.destination}.`);
                return this.storage.bucket(this.bucket).file(`${fileName}`)
                    .download(options);
          })
          .then(() => {
            console.log(`Unzipping to ${this.directory}${from['name']}`);
            return new Promise((resolve, reject) => {
                exec(`rm -rf ${this.directory}${from['name']} && unzip -x ${this.directory}${fileName} -d ${this.directory}${from['name']}`, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
          })
          .catch(err => {
            console.error(err);
          });
    }
}

export let acceptance = new Acceptance();