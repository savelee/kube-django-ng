'use strict';

var request = require('request');
const {WebhookClient} = require('dialogflow-fulfillment');


exports.balance = function(request, response){
    const agent = new WebhookClient({request: request, response: response});
    
    const SPENT_INTENT = '[search] Spent';
    const SALARY_INTENT = "[search] Salary";

    let intentMap = new Map();
    intentMap.set(SPENT_INTENT, filterSpent);
    intentMap.set(SALARY_INTENT, filterSalary);
    agent.handleRequest(intentMap);
}

function filterSpent(agent){
    const SPENT_PARAM = 'paymentcategories';
    console.log(agent);
    
    var p = agent.parameters[SPENT_PARAM];

    console.log(p);

    agent.add(`Filter on Spent: ${p}`);
}

function filterSalary(agent){
    agent.add("Filter on Salary");
}

const makeRequest = function(url, callback){
   request(url, function (error, response, body) {
       if(response && response.statusCode == 200){
           var data = JSON.parse(body);
           var result;
           for (var key in data) {
                result = data[key];
                break;
           }
           callback(result);  
       }
    });
};

