console.log("File server running...");

require('dotenv').config() //load environment vars

const Vision = require('@google-cloud/vision').v1;
const {Storage} = require('@google-cloud/storage');
const {PubSub} = require('@google-cloud/pubsub');
const {BigQuery} = require('@google-cloud/bigquery');

const express = require('express');
const app = express();
const cors = require('cors');
const multer  = require('multer');
/*const uploadStorage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads')
    },
    filename(req, file, cb) {
      cb(null, `${file.originalname}`)
    }
});*/
const uploadStorage  = multer.memoryStorage();
const upload = multer({ storage: uploadStorage })

const fs = require('fs');
app.use(cors());

const projectId = process.env.GCLOUD_PROJECT; //your project name
const bucketName = process.env.GCLOUD_STORAGE_BUCKET; //your bucket
const topicName = process.env.TOPIC; //your pub/sub topic for the file server
const bqDataSetName = process.env.DATASET;
const bqTableName = process.env.TABLE;
const bqSchema = 'TEXT, JSON, PAGE:INTEGER, LANGUAGE, LANGUAGECONF:FLOAT, PATH, TYPE, POSTED:TIMESTAMP';


console.log("..." + projectId);
console.log('...' + topicName);

const vision = new Vision.ImageAnnotatorClient({
    projectId: projectId
});

const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT
});

const pubsub = new PubSub({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const bigquery = new BigQuery({
    projectId: process.env.GCLOUD_PROJECT
});

const bucket = storage.bucket(bucketName);


//If topic is not created yet, please create.
const topic = pubsub.topic(`projects/${projectId}/topics/${topicName}`);
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


//Make use of a dataset called: chatanalytics
const dataset = bigquery.dataset(bqDataSetName);
//Make use of a BigQuery table called: chatmessages
const table = dataset.table(bqTableName);
//If BQ dataset and table don't exist, create it.
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


var uploadToStorage = function(assets, cb){
    var i = 0;
    var counter = 0;

    console.log(assets); //TODO this doesn't work in a production container yet. IAM issue? GKE secrets issue?
    
    for(i; i<assets.length; i++){

        console.log(assets[i] + 'to ' + bucketName);

        const gcsname = assets[i].originalname;
        const file = bucket.file(gcsname);
      
        const stream = file.createWriteStream({
          metadata: {
            contentType: assets[i].mimetype
          },
          resumable: false
        });
      
        stream.on('error', (err) => {
            console.error(err);
            cb(err);
        });
      
        stream.on('finish', () => {
            file.makePublic().then(() => {
                console.log(`${file.name} uploaded to ${bucketName}.`);
                cb(assets);
            });
        });
      
        stream.end(assets[i].buffer);
    }
};

var uploadJsonToStorage = function(fileName, json, cb){
    const file = bucket.file(fileName);
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/json'
      },
      resumable: false
    });
  
    stream.on('error', (err) => {
        console.error(err);
        cb(err);
    });
  
    stream.on('finish', () => {
        cb();
    });
  
    stream.end(file.buffer);
};

var detectOCR = function(files, res) {
    console.log(files);
    var me = this;
    var fileRequests = [];
    var imageRequests = [];
    var featuresConfig = [{
        type: 'DOCUMENT_TEXT_DETECTION' //specific for documents
    }]; //IMAGE_PROPERTIES, LOGO_DETECTION, WEB_DETECTION, LABEL_DETECTION, PRODUCT_SEARCH


    for(var i = 0; i<files.length; i++){
        const file = files[i];
        const gcsSourceUri = `gs://${bucketName}/${file.originalname}`;
        const gcsDestinationUri = `gs://${bucketName}/${file.originalname}.json`;
        
        if(file.mimetype == 'application/pdf' || file.mimetype == 'image/tiff'){
            var fileConfig = {
                mimeType: file.mimetype, // Supported mime_types are: 'application/pdf' and 'image/tiff'
                gcsSource: {
                    uri: gcsSourceUri
                }
            };
        
            var outputConfig = {
                batchSize: 1, //each page a seperate JSON file
                gcsDestination: {
                    uri: gcsDestinationUri
                }
            };

            var requestsElement = {
                inputConfig: fileConfig,
                outputConfig: outputConfig,
                features : featuresConfig
            };

            fileRequests.push(requestsElement);
        } else {

            var imageConfig = {
                source: {
                    imageUri: gcsSourceUri
                }
            };

            var requestsElement = {
                image: imageConfig,
                features : featuresConfig
            };            

            imageRequests.push({
                request: requestsElement,
                file: file
            });
        }
    }

    if(imageRequests.length > 0){

        imageRequests.forEach(function(item){
            //console.log(item.request);

            vision.annotateImage(item.request).then(function(result) { 
                if(result[0]){
                    var json = JSON.stringify(result[0].fullTextAnnotation.text);  
                    
                    if(json && result[0].fullTextAnnotation){
                        var fileresults = {};
                        fileresults.TEXT = json;
                        //fileresults.JSON = result[0]; //TODO! JSON.stringify(results[0])
                        fileresults.PAGE = result[0].fullTextAnnotation.pages.length;
                        if(result[0].fullTextAnnotation.pages.length > 0){
                            fileresults.LANGUAGE = result[0].fullTextAnnotation.pages[0].property.detectedLanguages[0].languageCode;
                            fileresults.LANGUAGECONF = result[0].fullTextAnnotation.pages[0].property.detectedLanguages[0].confidence;
                        }
                        fileresults.PATH = `gs://${bucketName}/${item.file.originalname}`;
                        fileresults.TYPE = item.file.mimetype;
                        fileresults.POSTED = (new Date().getTime()/1000);
            

                        uploadJsonToStorage(item.file.originalname+".json", json, function(){
                            console.log("Image results stored as JSON in GCS");
                           
                            console.log(fileresults);

                            pushIt(fileresults, function(data){
                                res.send("Image results stored as JSON in GCS. Pushed to Pub/Sub: " + data);
                            });
                        });
                    }

                }
            })
            .catch(function(err) {
                console.error(err);
                res.send({err});
            });
        });
    }
    if(fileRequests.length > 0){

        vision.asyncBatchAnnotateFiles({requests: fileRequests}).then(function(result) {       

            var response = { 
                title: "The PDF will be processed."
            };
    
            //A CLOUD FUNCTION ON TRIGGER THAT PUSHES CONTENTS TO PUB/SUB
            
            console.log(response.title);
            res.send({response});
        })
        .catch(function(err) {
            console.error(err);
            res.send({err});
        });

    }
};

var pushIt = async function(obj, cb) {
    var data = Buffer.from(JSON.stringify(obj),'utf-8');
    //console.log("PUSH IT!");
    const publisher = topic.publisher();
    const callback = (err, messageId) => {
      if (err) {
        console.log(err);
      } else {
        console.log(messageId);
        cb(messageId);
      }
    };
    
    publisher.publish(data, callback);
};


app.post('/upload', upload.array('upload', 12), function (req, res, next) {
    uploadToStorage(req.files, function(objs){
        detectOCR(objs, res);
    });
});

app.listen(3200);
