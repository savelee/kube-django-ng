console.log("Chatserver running...");

require('dotenv').config() //load environemnt vars

const projectId = process.env.GCLOUD_PROJECT; //your project name
const topicName = 'user-content'; //TODO process.env.TOPIC
const uuidv1 = require('uuid/v1');
const sessionId = uuidv1(); // ⇨ '45745c60-7b1a-11e8-9c9c-2d42b21b1a3e'
const languageCode = 'en-US';
const debug_mode = true;

const server = require('http').createServer((request, response) => {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(`Chat Server Running`);
    response.end();
});


const io = require('socket.io')(server);
io.set('origins', '*:*');
const structjson = require('./structjson');
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();

console.log("..." + projectId);
console.log('...' + sessionId);
console.log('...' + topicName);

//console.log(sessionClient);

//const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

const PubSub = require('@google-cloud/pubsub');
const BQ = require('@google-cloud/bigquery');

const pubsub = new PubSub({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const bigquery = new BQ({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

//Make use of a dataset called: chatanalytics
const dataset = bigquery.dataset('chatanalytics');
//Make use of a BigQuery table called: chatmessages
const table = dataset.table('chatmessages');

var queryIt = function(sql){
    var promise = new Promise(function(resolve, reject){

        if(sql){
            dataset.exists(function(err, exists) {
                if(!exists){
                    dataset.create({
                      id: 'chatanalytics'
                    }).then(function(data) {
                      console.log("dataset created");
                
                      //If the table doesn't exist, let's create it.
                      //Note the schema that we will pass in.
                      table.exists(function(err, exists) {
                        if(!exists){
                          table.create({
                            id: 'chatmessages',
                            schema: 'TEXT, POSTED:TIMESTAMP, SCORE:FLOAT, MAGNITUDE:FLOAT, INTENT, CONFIDENCE:FLOAT, SESSION'
                          }).then(function(data) {
                            console.log("table created");
                          });
                        }
                      });
                
                    });
                } else {
                    //make the query
                    bigquery.query(sql).then(function(data){
                        resolve(data);
                    });
                }
            });
        } else {
            reject("Missing sql");
        }


    });
    return promise;
};

var pushIt = function(obj) {
    //var dataBuffer = Buffer.from(text, 'utf-8');
    var dataBuffer = Buffer.from(JSON.stringify(obj),'utf-8');
    const topic = pubsub.topic(topicName);

    //If topic is not created yet, please create.

    topic.exists((err, exists) => {
        if(!exists){
            pubsub.createTopic(topicName).then(results => {
                    console.log(`Topic ${topicName} created.`);
                })
                .catch(err => {
                    console.error('ERROR:', err);
            });
        }
    });

    const publisher = topic.publisher();
    publisher.publish(dataBuffer)
    .then((results) => {
        console.log('Message published.');
        return results;
    }).catch((e) => {
        console.log('Something went wrong with Pub/Sub');
        console.log(e);
    });

};

function detectIntent(request, cb){
    // Send request and log result
    sessionClient.detectIntent(request)
    .then(responses => {
        var result = responses[0].queryResult;
        
        if(debug_mode){
            console.log('Detected intent');
            console.log(`  Query: ${result.queryText}`);
            console.log(`  Response: ${result.fulfillmentText}`);

 
            if (result.intent) {
                console.log(`  Intent: ${result.intent.displayName}`);
                console.log(result.fulfillmentMessages);
            } else {
                console.log(`  No intent matched.`);
            }
        }

        if(result){

            var p = structjson.structProtoToJson(result.parameters);
            if(result.action && result.action == 'spent') {
                var spentObj = {
                    name: 'spent',
                    param: p['category']
                }
                cb(spentObj, result.intent.intentDetectionConfidence, "BalanceBot");
                return;
            }
            if(result.action && result.action == 'income') {
                var incomingObj = {
                    name: 'salary',
                    param: p['category']
                }
                cb(incomingObj, result.intent.intentDetectionConfidence, "BalanceBot");
                return;
            }
            
            var dialogs = result.fulfillmentMessages;
            for (var i = 0, len = dialogs.length; i < len; i++) {
                var messageType = dialogs[i].message; //text || payload
                var answer = "";

                //custom payload example
                if(messageType == "payload"){
                    var custom = structjson.structProtoToJson(dialogs[i]["payload"])["web"];
                    console.log(custom);
                    //hyperlink
                    if(custom.type == "hyperlink"){
                        answer = `<a href="${custom.link}" target="_blank">${custom.text}</a>`;
                    }
                    //thumbnail
                    else if(custom.type == "thumb"){
                        answer = `<img src="${custom.image}" width="100"/><a href="${custom.link}" target="_blank">${custom.text}</a>`;
                    }
                    //map
                    else if(custom.type == "map"){
                        var greet = "";
                        if(custom.function){
                            fn = new Function(custom.function);
                            greet = fn();
                        }
                        answer = greet + `<iframe src="${custom.link}" width="400" height="225" frameborder="0" style="border:0" allowfullscreen></iframe>`;
                    }
                    
                } else {
                    if(dialogs[i]["text"])
                        answer = dialogs[i]["text"].text;
                }

                if(answer){
                    //console.log(result.intent.intentDetectionConfidence);
                    cb(answer, result.intent.intentDetectionConfidence, "ChatBot");
                }
            }
        }
    })
    .catch(err => {
        console.error('ERROR:', err);
        io.emit('systemerror', {
            username: "ChatBot",
            message: err
        });
    });
}

io.on('connection', function(client){
    
    client.on('welcome', function(data){
        console.log(data);
        console.log("TODO greet with username");

        if(data) {
            // The text query request.
            var request = {
                session: sessionPath,
                queryInput: {
                    event:{  
                        name: 'websitewelcome',
                        parameters: structjson.jsonToStructProto({user: data.username}),
                        languageCode: languageCode
                    }
                }
            };
        } else {
            var request = {
                session: sessionPath,
                queryInput: {
                    event:{  
                        name: 'websitewelcome',
                        languageCode: languageCode
                    }
                }
            };         
        }

        detectIntent(request, function(botAnswer, confidence, botName){

            io.emit('agentmsg', {
                username: botName,
                message: botAnswer,
                confidence: confidence,
                session: client.id
            });
        });

    });

    // when the client emits 'msg', this listens and executes
    client.on('msg', function(data){

        // The text query request.
        const request = {
            session: sessionPath,
            queryInput: {
            text: {
                text: data,
                languageCode: languageCode,
            },
            },
        };
    
        detectIntent(request, function(botAnswer, confidence, botName){

            var analytics = {};
            analytics.text = data;
            analytics.posted = new Date().getTime();
            analytics.intent = botAnswer.toString();
            analytics.confidence = confidence;
            analytics.session = client.id;
            
            //push data into pub/sub
            console.log(analytics);

            // we tell the client to execute 'agentmsg'
            io.emit('agentmsg', {
                username: botName,
                message: botAnswer,
                confidence: confidence,
                session: client.id
            });

            pushIt(analytics);
        });
    });

    // when the client emits 'typing', we broadcast it to others
    client.on('typing', function () {
        //console.log("typing");
    });

    client.on('disconnect', function(){
        console.log("Close Connection");
    });

    // when the client loads the realtime dashboard
    client.on('dashboardload', function () {
        console.log("load dashboard");

        var queryCountTotals = "SELECT COUNT(TEXT) AS totals from `chatanalytics.chatmessages`";
        var queryNegativesTotals = "SELECT COUNT(TEXT) AS totalnegatives from `chatanalytics.chatmessages` where SCORE < 0";
        var queryImproveBot = "SELECT TEXT, INTENT, SESSION  from `chatanalytics.chatmessages` where CONFIDENCE IS NULL AND INTENT LIKE '%Sorry%' LIMIT 5";
        var queryNegatives = "SELECT SCORE, TEXT, SESSION from `chatanalytics.chatmessages` where SCORE < 0 ORDER BY SCORE ASC LIMIT 5";
        
        var r1 = queryIt(queryCountTotals); //as totals
        var r2 = queryIt(queryNegativesTotals); //as totalnegatives
        var r3 = queryIt(queryImproveBot); // else
        var r4 = queryIt(queryNegatives); //if score

        Promise.all([r1, r2, r3, r4]).then(function(values) {

            var negatives = [], unhandled = [], totalNegatives, totals;
            var data = {};
            values.forEach(function(item){
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

            data.totals = totals;
            data.totalNegatives = totalNegatives;
            data.negatives = negatives;
            data.unhandled = unhandled;

            // we tell the client to execute 'dashboarddata'
            io.emit('dashboarddata', data);
        }).catch(function(error) {
            console.log(error);
          });
    });
    // when the client sends the session id from the realtime dashboard
    client.on('getsession', function (session) {
        
        var querySession = "SELECT * from `chatanalytics.chatmessages` where SESSION = '"+ session +"' ORDER BY POSTED";
        
        var result = queryIt(querySession);
        var searchresults = [];
            
        Promise.all([result]).then(function(values) {
            values.forEach(function(item){
                searchresults.push(item[0]);
            });
            // we tell the client to execute 'dashboarddata'
            io.emit('dashboardsearch', searchresults);
        });
        

    });

});
server.listen(3000); //TODO

