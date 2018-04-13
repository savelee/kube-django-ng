require('dotenv').config() //load environemnt vars

const projectId = 'gke-pipeline-savelee-192517'; //https://dialogflow.com/docs/agents#settings
const sessionId = 'leeboonstra-kubedjangodemo';
const languageCode = 'en-US';
const debug_mode = true;

const uuidv1 = require('uuid/v1');
const server = require('http').createServer();
const io = require('socket.io')(server);
io.set('origins', '*:*');
const structjson = require('./structjson');
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();

console.log(sessionClient);

//const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

const PubSub = require('@google-cloud/pubsub');
const pubsub = new PubSub({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: process.env.GCLOUD_KEY_FILE
});

var pushIt = function(obj) {
    //var dataBuffer = Buffer.from(text, 'utf-8');
    var dataBuffer = Buffer.from(JSON.stringify(obj),'utf-8');
    
    const topic = pubsub.topic('user-content');
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
                    cb(answer, result.intent.intentDetectionConfidence);
                }
            }
        }
    })
    .catch(err => {
        console.error('ERROR:', err);
        io.emit('systemerror', {
            username: "Bot",
            message: err
        });
    });
}

io.on('connection', function(client){
    
    client.on('welcome', function(data){
        //console.log(data.username);

        // The text query request.
        const request = {
            session: sessionPath,
            queryInput: {
                event:{  
                    name: 'websitewelcome',
                    parameters: structjson.jsonToStructProto({user: data.username}),
                    languageCode: languageCode
                }
            }
        };

        console.log(request);
        detectIntent(request);

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
    
        detectIntent(request, function(botAnswer, confidence){

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
                username: "Bot",
                message: botAnswer
            });

            
            //pushIt(data);
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

});
server.listen(3000); //TODO

