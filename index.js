/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:*'; // enables lib debugging statements
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });

  
  function writeToDb (agent) {
    // Get parameter from Dialogflow with the string to add to the database
    const databaseEntry = agent.parameters.databaseEntry;

    // Get the database collection 'dialogflow' and document 'agent' and store
    // the document  {entry: "<value of database entry>"} in the 'agent' document
    const dialogflowAgentRef = db.collection('dialogflow').doc('agent');
    return db.runTransaction(t => {
      t.set(dialogflowAgentRef, {entry: databaseEntry});
      return Promise.resolve('Write complete');
    }).then(doc => {
      agent.add(`Wrote "${databaseEntry}" to the Firestore database.`);
    }).catch(err => {
      console.log(`Error writing to Firestore: ${err}`);
      agent.add(`Failed to write "${databaseEntry}" to the Firestore database.`);
    });
  }

  function readFromDb (agent) {
    // Get the database collection 'dialogflow' and document 'agent'
    const dialogflowAgentDoc = db.collection('dialogflow').doc('agent');

    // Get the value of 'entry' in the document and send it to the user
    return dialogflowAgentDoc.get()
      .then(doc => {
        if (!doc.exists) {
          agent.add('No data found in the database!');
        } else {
          agent.add(doc.data().entry);
        }
        return Promise.resolve('Read complete');
      }).catch(() => {
        agent.add('Error reading entry from the Firestore database.');
        agent.add('Please add a entry to the database first by saying, "Write <your phrase> to the database"');
      });
  }

  
    function readlectures (agent) {
   
      const day = agent.parameters.day;
      const time = agent.parameters.time;
      console.log(day);
      console.log(time);
       // Get the database collection 'dialogflow' and document 'agent'
    const dialogflowlecDoc = db.collection('lectures').doc(day);
     console.log(dialogflowlecDoc);

    // Get the value of 'entry' in the document and send it to the user
    return dialogflowlecDoc.get()
      .then(doc => {
        if (!doc.exists) {
          agent.add('No data found in the database!');
        } else {
          console.log('Data:'+doc.data());
          agent.add(doc.data());
        }
        return Promise.resolve('Read complete');
      }).catch(() => {
        agent.add('Error reading entry from the Firestore database.');
        agent.add('Please add a entry to the database first by saying, "Write <your phrase> to the database"');
      });
  }
  
  
  function firestor(agent)
  {var dateAp=agent.parameters.date;
   var timeAp=agent.parameters.time;
   var AppointmemtTime=agent.parameters.time.split('T')[1].split(':')[0]; 
   console.log(AppointmemtTime);
   var name=agent.parameters.name;
     var date=convertParametersDate(dateAp,timeAp);
   var day=date.getDay();
   
   
   var Boolean_var= availability(day,date,AppointmemtTime);
   console.log(`BOOLEAN ${Boolean_var}`);
   
   if(Boolean_var==0)
   {agent.add('Appointment cannot be scheduled as the slot is unavailable.The college hours are from 9 AM to 4 PM and no appointments are booked on weekends.Try again.');
   }
   else
   { 
    //agent.add(Boolean_var);
    const dialogflowAgentReference = db.collection('Appointments').doc(name);
    return db.runTransaction(t => {
      t.set(dialogflowAgentReference, {date:date,time:timeAp,day:day});
      return Promise.resolve('Write complete');
    }).then(doc => {
      agent.add(`Appointment scheduled and stored in database`);
    }).catch(err => {
      console.log(`Error writing to Firestore: ${err}`);
      agent.add(`Failed to write  to the Firestore database.`);
    }); 
   }
  }
  
  function convertParametersDate(date, time){
  return new Date(Date.parse(date.split('T')[0] + 'T' + time.split('T')[1].split('-')[0] ));
}
  function availability (day,date,AppointmentTime)
{ 
  if(day==0||day==6)
  {
return false;  
  }
else
 {    console.log((AppointmentTime));
     if( AppointmentTime>9 &&AppointmentTime<16)
     {	return true;
     }
   else 
   {	return false;
   }
}
 }


  // Map from Dialogflow intent names to functions to be run when the intent is matched
  let intentMap = new Map();
  intentMap.set('ReadFromFirestore', readFromDb);
  intentMap.set('Appointment', firestor);
   intentMap.set('WriteToFirestore', writeToDb);
  intentMap.set('Lectures', readlectures);
  agent.handleRequest(intentMap);
});
