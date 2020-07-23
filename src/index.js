const theirtube = require('./theirtube.js');
const schedule = require('node-schedule');
const argv = require('yargs').argv;
const chalk = require('chalk');

let minute;
let hour;
let iterationAmmount;
let iterationCount = -1;

//npm run scrape -- --scrapeMinute=03 --scrapeHour=17 
if ( (argv.scrapeMinute != null) && (argv.scrapeHour != null)) {
   minute = argv.scrapeMinute;
   hour = argv.scrapeHour;
   console.log(chalk.black.bgYellowBright("Theirtube Scraping Everyday at — " + hour + ":" + minute + '\n'));
 } else {
   minute = "00";
   hour = "12";
   console.log(chalk.black.bgYellowBright("Time not set : Theirtube Scraping Everyday at — " + hour + ":" + minute + '\n'));
 }


//Using the acount below can switch between several accounts.
//make sure to start each account you want to get data with the number below
const persona_list = {
   persona1: 1,
   persona2: 2,
   persona3: 3,
   // persona4: 4,
   // persona5: 5,
   // persona6: 6,
 }
const persona_array = Object.entries(persona_list);

//For more reference : https://www.npmjs.com/package/node-schedule
let schedulebot = schedule.scheduleJob(minute+" "+hour+" * * *", function(){
   iterationCount++;
   console.log("This is iteration count : " + iterationCount);
   scrapeAll();

   if(iterationCount > iterationAmmount){
      schedulebot.cancel();
   }
 })


 async function scrapeAll() {
  //initialise when activating for the first time.
  if(iterationCount==0){
  await theirtube.initialize();}

  for (const persona of persona_array) {
     console.log("scraping from :" + persona[0]);
     await theirtube.switchAccount(persona);
     await theirtube.scrape(persona);
   }
}