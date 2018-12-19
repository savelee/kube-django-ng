const {PubSub} = require('@google-cloud/pubsub');

require('dotenv').config() //load environment vars

const pubsub = new PubSub({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const projectId = 'gke-pipeline-savelee-192517';
const topicName = 'file-content';

const topic = pubsub.topic(`projects/${projectId}/topics/${topicName}`);
const publisher = topic.publisher();


var obj = { text:
    '"14:311\\nIl\\n0\\n+ Gegevens rit\\nN2OS\\n$100\\nGoogle\\nS106\\nMap data ©2018 Google\\n27-11-18 16:05\\nMercedes-Benz C-klasse\\n€ 21,45\\nVoeg fooi toe\\n• Middenweg 107, 1505 RK Zaandam, Nederland\\nOvertoom 327B, 1054 JM Amsterdam, Nederland\\nJouw rit met Reshad\\nHelp\\nFactuur\\nUberX factuur\\nBasistarief\\n€1.00\\nTijd\\n€4.64\\nAfstand\\n€15.81\\nSubtotal\\n€21.45\\nTotal\\n€21.45\\nMASTERCARD 4128\\n27-11-18 16:31\\n€ 21,45\\n"',
   pages: 1,
   language: 'nl',
   languageConf: 0.49000000953674316,
   path: 'gs://leeboonstra-visionocr/27nov-uber-21.45.PNG',
   type: 'image/png',
   posted: 1545139842878 };

var data = Buffer.from(JSON.stringify(obj),'utf-8');

const callback = (err, messageId) => {
  if (err) {
    console.log(err);
  } else {
    console.log(messageId);
  }
};

publisher.publish(data, callback);

