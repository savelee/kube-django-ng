const {BigQuery} = require('@google-cloud/bigquery');

const bq = new BigQuery();

const bqDataSetName = process.env.DATASET;
const bqTableName = process.env.TABLE;
const bqSchema = 'TEXT, JSON, PAGE:INTEGER, LANGUAGE, LANGUAGECONF:FLOAT, PATH, TYPE, POSTED:TIMESTAMP';

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
  
//Insert rows in BigQuery
var insertInBq = function(row){
    console.log(row);

    table.insert(row, function(err, apiResponse){
        console.log(apiResponse);
        if (!err) {
            console.log("[BIGQUERY] - Saved.");
        } else {
            console.error(err);
        }
    });
};

exports.subscribe = (data, context) => {
    const pubSubMessage = data;
    const buffer = Buffer.from(pubSubMessage.data, 'base64').toString();
    var buf = JSON.parse(buffer);
    
    //TODO AUTO ML CALLS

    console.log(buf.TEXT);

    insertInBq(buf);
};