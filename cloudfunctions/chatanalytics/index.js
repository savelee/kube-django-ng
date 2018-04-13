//require the google-cloud npm package
//setup the API keyfile, so your local environment can
//talk to the Google Cloud Platform
const bq = require('@google-cloud/bigquery')();
const language = require('@google-cloud/language');
const translate = require('@google-cloud/translate')();

//Make use of a dataset called: chatanalytics
const dataset = bq.dataset('chatanalytics');
//Make use of a BigQuery table called: chatmessages
const table = dataset.table('chatmessages');

var getSentiment = function(text, callback){
    const client = new language.LanguageServiceClient();

    client.analyzeSentiment({
        document: {
            content: text,
            type: 'PLAIN_TEXT'
        }
    }).then(function(responses) {
        var result = responses[0].documentSentiment;
        
        callback(result);
    })
    .catch(function(err) {
        console.error(err);
    });
};


  //If the dataset doesn't exist, let's create it.
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
    }
  });
  
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
  
  //Insert rows in BigQuery
  var insertInBq = function(row){
    table.insert(row, function(err, apiResponse){
      if (!err) {
        console.log("[BIGQUERY] - Saved.");
      }
    });
  };
  
 /**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event The Cloud Functions event.
 * @param {!Function} The callback function.
 */
exports.subscribe = (event, callback) => {
    // The Cloud Pub/Sub Message object.
    const pubsubMessage = event.data;
  
    //console.log(event);

    // We're just going to log the message to prove that
    // it worked.
    var buffer = Buffer.from(pubsubMessage.data,'base64').toString();
    console.log(buffer);

    var buf = JSON.parse(buffer);

    console.log(buf.text);

    var sentiment = getSentiment(buf.text, function(sentiment){
        var bqRow = {
            text: buf.text,
            posted: (buf.posted/1000),
            score: sentiment.score,
            magnitude: sentiment.magnitude,
            intent: buf.intent,
            confidence: buf.confidence,
            session: buf.session
        };
        insertInBq(bqRow);

    });

    // Don't forget to call the callback.
    callback();
  };
  