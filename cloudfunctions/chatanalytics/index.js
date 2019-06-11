const { BigQuery } = require('@google-cloud/bigquery');
const language = require('@google-cloud/language');
const DLP = require('@google-cloud/dlp');

const projectId = process.env.GCLOUD_PROJECT;
const bqDataSetName = process.env.DATASET;
const bqTableName = process.env.TABLE;
const bqSchema = `
    BOT_NAME,
    TEXT, 
    POSTED:TIMESTAMP, 
    SCORE:FLOAT, 
    MAGNITUDE:FLOAT, 
    INTENT_RESPONSE,
    INTENT_NAME,
    CONFIDENCE:FLOAT,
    IS_FALLBACK: BOOLEAN, 
    IS_FULFILLMENT: BOOLEAN,
    IS_END_INTERACTION: BOOLEAN,
    PLATFORM,
    SESSION`;

const bq = new BigQuery();
const dlp = new DLP.DlpServiceClient();

// Make use of a dataset called: chatanalytics
const dataset = bq.dataset(bqDataSetName);
// Make use of a BigQuery table called: chatmessages
const table = dataset.table(bqTableName);

var detectPIIData = async function(text, callback) {
  // The minimum likelihood required before returning a match
  const minLikelihood = 'LIKELIHOOD_UNSPECIFIED';
 
  // The infoTypes of information to match
  const infoTypes = [ 
    {name: 'PERSON_NAME'}, 
    {name: 'IBAN_CODE'},
    {name: 'IP_ADDRESS'},
    {name: 'LOCATION'},
    {name: 'SWIFT_CODE'},
    {name: 'PASSPORT'},
    {name: 'PHONE_NUMBER'},
    {name: 'NETHERLANDS_BSN_NUMBER'},
    {name: 'NETHERLANDS_PASSPORT'}
  ];
  

  // Construct transformation config which replaces sensitive info with its info type.
  // E.g., "Her email is xxx@example.com" => "Her email is [EMAIL_ADDRESS]"
  const replaceWithInfoTypeTransformation = {
    primitiveTransformation: {
      replaceWithInfoTypeConfig: {},
    },
  };

  // Construct redaction request
  const request = {
    parent: dlp.projectPath(projectId),
    item: {
      value: text,
    },
    deidentifyConfig: {
      infoTypeTransformations: {
        transformations: [replaceWithInfoTypeTransformation],
      },
    },
    inspectConfig: {
      minLikelihood: minLikelihood,
      infoTypes: infoTypes,
    },
  };

  // Run string redaction
  try {
    const [response] = await dlp.deidentifyContent(request);
    const resultString = response.item.value;
    console.log(`REDACTED TEXT: ${resultString}`);
    if (resultString) {
      callback(resultString);
    } else {
      callback(text);
    }
  } catch (err) {
    console.log(`Error in deidentifyContent: ${err.message || err}`);
    callback(text);
  }
}

var getSentiment = function(text, callback){
    const client = new language.LanguageServiceClient();

    client.analyzeSentiment({
        document: {
            content: text,
            type: 'PLAIN_TEXT'
        }
    }).then(function(responses) {
        var result = responses[0].documentSentiment;
        
        console.log('SENTIMENT:');
        console.log(result);

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
        console.log(row);
        console.log("[BIGQUERY] - Saved.");
      } else {
        console.error(err);
      }
    });
  };


  exports.subscribe = (data, context, callback) => {
    const pubSubMessage = data;
    const buffer = Buffer.from(pubSubMessage.data, 'base64').toString();
    var buf = JSON.parse(buffer);
    
    console.log(buf.text);

    var bqRow = {
      BOT_NAME: buf.botName,
      POSTED: (buf.posted/1000),
      INTENT_RESPONSE: buf.intentResponse,
      INTENT_NAME: buf.intentName,
      IS_FALLBACK: buf.isFallback, 
      IS_FULFILLMENT: buf.isFulfillment,
      IS_END_INTERACTION: buf.isEndInteraction,   
      CONFIDENCE: buf.confidence,
      PLATFORM: buf.platform,
      SESSION: buf.session
    };

    getSentiment(buf.text, function(sentiment){
      bqRow['SCORE'] = sentiment.score;
      bqRow['MAGNITUDE'] = sentiment.magnitude;

      detectPIIData(buf.text, function(formattedText) {
        bqRow['TEXT'] = formattedText;
        insertInBq(bqRow);
      });
  });

    // Don't forget to call the callback.
    callback();
  };

  