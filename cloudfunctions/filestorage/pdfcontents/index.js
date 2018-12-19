const {Storage} = require('@google-cloud/storage');
const {PubSub} = require('@google-cloud/pubsub');

const storage = new Storage();
const pubsub = new PubSub();

const projectId = process.env.GCLOUD_PROJECT; //your project name
const bucketName = process.env.GCLOUD_STORAGE_BUCKET; //your bucket
const topicName = process.env.TOPIC; //your pub/sub topic for the file server

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

var pushIt = async function(obj, cb) {
    var data = Buffer.from(JSON.stringify(obj),'utf-8');
    
    console.log("PUSH IT!");

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

/**
 * Triggered from a change to a Cloud Storage bucket.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
exports.onFileStorage = (data, context) => {
    const file = data;
    var result;

    console.log(`  File: ${file.name}`);
    console.log(`  Type: ${file.contentType}`);
    
    //check if file ends with .json
    if (file.contentType == 'application/json' || file.contentType == 'application/octet-stream'){
        
        //get the JSON contents
        storage
        .bucket(file.bucket)
        .file(file.name)
        .download()
        .then(function(data){
            if (data) result = data.toString();
            result = JSON.parse(result);

            //prepare for Pub/Sub
            var fileresults = {};
            var pages = result.responses;
            console.log(pages.length)
            
            var i;
            for (i = 0; i < pages.length; i++) { 
                fileresults.TEXT = pages[i].fullTextAnnotation.text;
                //fileresults.JSON = pages[i]; //TODO! JSON.stringify(pages[i])
                fileresults.PAGE = pages[i].context.pageNumber;
                fileresults.LANGUAGE = pages[i].fullTextAnnotation.pages[0].property.detectedLanguages[0].languageCode;
                fileresults.LANGUAGECONF = pages[i].fullTextAnnotation.pages[0].property.detectedLanguages[0].confidence;
                fileresults.PATH = pages[i].context.uri;
            }

            fileresults.TYPE = file.contentType;
            fileresults.POSTED = (new Date().getTime()/1000);

            console.log(fileresults);

            //publish
            pushIt(fileresults, function(){
                console.log("DONE");
            });

        })
        .catch(function(e){ console.log(e); })

    }

};