//require the google-cloud npm package
//setup the API keyfile, so your local environment can
//talk to the Google Cloud Platform

const {BigQuery} = require('@google-cloud/bigquery');
const language = require('@google-cloud/language');
//const dlp = require('@google-cloud/dlp')(); //TODO this feture is yet missing

const bqDataSetName = process.env.DATASET;
const bqTableName = process.env.TABLE;
const bqSchema = 'TEXT, POSTED:TIMESTAMP, SCORE:FLOAT, MAGNITUDE:FLOAT, INTENT, CONFIDENCE:FLOAT, SESSION';
const bq = new BigQuery();

//Make use of a dataset called: chatanalytics
const dataset = bq.dataset(bqDataSetName);
//Make use of a BigQuery table called: chatmessages
const table = dataset.table(bqTableName);

dataset.exists(function(err, exists) {
    if(!exists){
        dataset.create({
          id: bqDataSetName
        }).then(function(data) {
          console.log("dataset created");
    
          //If the table doesn't exist, let's create it.
          //Note the schema that we will pass in.
          table.exists(function(err, exists) {
            if(!exists){
              table.create({
                id: bqTableName,
                schema: bqSchema
              }).then(function(data) {
                console.log("table created");
              });
            }
          });
    
        });
    }
});

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

  //Insert rows in BigQuery
  var insertInBq = function(row){
    table.insert(row, function(err, apiResponse){
      if (!err) {
        console.log("[BIGQUERY] - Saved.");
      }
    });
  };

  
  exports.subscribe = (data, context, callback) => {
    const pubSubMessage = data;
    const buffer = Buffer.from(pubSubMessage.data, 'base64').toString();
    var buf = JSON.parse(buffer);
    
    //TODO AUTO ML CALLS

    console.log(buf.TEXT);

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

  