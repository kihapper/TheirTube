const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const path = require('path');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const chalk = require('chalk');
const BASE_URL = 'https://www.youtube.com/';
//directory of cookie where the puppeteer will look for.
const COOKIE_PATH = path.join(__dirname, '../cookies/curator1_cookie');
//path to where the scraped data goes
const JSON_PATH = path.join(__dirname, '/video_data_scraped.json');

puppeteer.use(StealthPlugin());

//this iteration_num decides how many numbers of videos to scrape
//Use 8 to scrape all the top page results
let iteration_num = 8;
let browser = null;
let page = null;

const theirtube = {

    initialize: async () => {

        browser = await puppeteer.launch({
            userDataDir: COOKIE_PATH,
            headless: false,
            devtools: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu'
            ]
        });

        page = await browser.newPage();

        await page.setViewport({
            width: 1200,
            height: 1000,
        });

        console.log(await browser.userAgent());
        await page.goto(BASE_URL);
        console.log(chalk.black.bgCyanBright(' Initialized, Going to —>" + BASE_URL'));

    },

    login: async (username, password) => {

        //Go to sign in button
        await page.waitFor('paper-button[aria-label="Sign in"]');
        console.log("Waitng for Sign-In button becomes clickable");
        await page.click('paper-button[aria-label="Sign in"]');

        //Typing in the users name
        await page.waitFor(500);
        await page.waitForSelector('#identifierId');
        await page.type('#identifierId', username, { delay: 70 });
        console.log('Typing in the users name...');

        //Clicking the Next button
        await page.waitFor(500);
        await page.waitForSelector('#identifierNext');
        await page.click('#identifierNext');
        console.log('Clicking the Next button...');

        //Type in the password, wait 2 seconds since form take while to load
        console.log('Typing in the password...');
        await page.waitFor(2500);
        await page.waitForSelector('#password');
        await page.type('#password', password, { delay: 80 });

        //Sending the Password
        await page.waitFor(500);
        await page.waitForSelector('#passwordNext');
        await page.click('#passwordNext');
        console.log('🖱 :Clicking the Send password button...');
    },

    switchAccount: async (accountNum) => {
        
        //This function gets an array with the name and the number of the persona. ex: conspiracist - 1
        console.log("🤓 Switching Account" + accountNum[0] + ":" + accountNum[1]);
        accountNum = accountNum[1]

        //Clicking the Top Left Account button
        await page.waitForSelector('#avatar-btn');
        await page.click('#avatar-btn');
        console.log('🖱 : Top left Icon clicked');
        await page.waitFor(2000);


        //page.evaluate() moves the context within the browser, so output will be inside the browser
        await page.evaluate(() => {
            //gets first the whole menu div with contentwrapper, then get the top 5
            let dropMenuAll = document.querySelector('#contentWrapper');
            dropMenuAll = dropMenuAll.querySelector('#items');
            dropMenuAll = dropMenuAll.querySelectorAll('ytd-compact-link-renderer');

            //This Array method transforms NodeList element into Array element. More on that 
            const dropMenuArray = Array.from(dropMenuAll);

            //find is a function that lets you get the first element within an array
            dropMenuArray.find(menu => menu.innerText === 'Switch account').click();

        });
        console.log("🖱 : [Switch Account] clicked");
        //It needs 500ms wait for it to execute properly
        await page.waitFor(2000);

        await page.evaluate((accountNum) => {

            console.log(accountNum);

            //Moves on to the bot selection part...
            //This endless array of selection is to get through the endless div layers
            let channelMenu = document.querySelector('#submenu');
            channelMenu = channelMenu.querySelector('#container')
            channelMenu = channelMenu.querySelector('#sections')
            channelMenu = channelMenu.querySelector('#contents')
            channelMenu = channelMenu.querySelector('#contents')
            channelMenu = channelMenu.querySelectorAll('ytd-account-item-renderer')

            
            //Starts with returns the array with the initial text matching the accountNum, which is a number
            const channelMenuArray = Array.from(channelMenu)
            let selectedBot = channelMenuArray.find(channels => channels.innerText.startsWith(String(accountNum)));
            console.log("Selecting..." + selectedBot.innerText);
            selectedBot.click();
        },accountNum);
        console.log("🖱 : Account icon clicked" + '\n');
        await page.waitFor(1100);

    },

    scrape: async (accountName) => {
        //This  gets an array with the name of the persona[0] is the name lable conspiracist.
        accountName = accountName[0];

        await page.waitFor("#content");
        console.log("🔨 Scraper Starting for : " + accountName + " ——— waiting 5 seconds " + '\n');
        await page.waitFor(5000);

        //——Making screenshot of each file

        //generating DD-MM-YY sequence name for the folder.
        let today = new Date();
        today = today.toISOString().substring(0, 10);

        //checking if the DD-MM-YY folder exists, and if not make one.
        let screenshot_dir = path.join(__dirname, `../screenshot/${today}`);
        if (!fs.existsSync(screenshot_dir)){
            fs.mkdirSync(screenshot_dir);
        }

        //make a photo based on the iteraction count 
        let SCREENSHOT_PATH = path.join(__dirname, `../screenshot/${today}/${today}${accountName}.jpg`);
        await page.screenshot({ path: SCREENSHOT_PATH });

        //$$ works exactly as a document.querySelectorAll() would in the browser console
        let videoArray = await page.$$('#content > .ytd-rich-item-renderer');
        let videos = [];
        let iteration = 0;

        for (let videoElement of videoArray) {

            var video = {};
            let youtube_url = "https://www.youtube.com";

            try{
            //.getAttribute gets elements within the class in HTML
            video.title = await videoElement.$eval('#video-title', element => element.innerText);
            video.url = await videoElement.$eval('h3[class="style-scope ytd-rich-grid-video-renderer"] a[class="yt-simple-endpoint style-scope ytd-rich-grid-video-renderer"]', element => element.getAttribute('href'));
            video.url = youtube_url.concat(video.url);
            video.channel = await videoElement.$eval('a[class="yt-simple-endpoint style-scope yt-formatted-string"]', element => element.innerText);
            video.channel_url = await videoElement.$eval('a[class="yt-simple-endpoint style-scope yt-formatted-string"]', element => element.getAttribute('href'));
            video.channel_url = youtube_url.concat(video.channel_url);
            video.channel_icon = await videoElement.$eval('a[class="yt-simple-endpoint style-scope ytd-rich-grid-video-renderer"] img[class="style-scope yt-img-shadow"]', element => element.getAttribute('src'));
            video.thumbnail = await videoElement.$eval('img[class="style-scope yt-img-shadow"]', element => element.getAttribute('src'));
            video.viewnum = await videoElement.$eval('span[class="style-scope ytd-video-meta-block"]', element => element.innerText);
            video.date = await videoElement.$eval('div[class="style-scope ytd-video-meta-block"]', element => element.innerText);
            video.date = video.date.split("\n")[2];
            videos.push(video);
            console.log(video.title);
            }
            catch(e){
                console.log("‼️ Error occured during scraping" + e);
                return e
            }

            //Decides how many time it loops through, definetely a better way to write this.
            iteration++
            if (iteration == iteration_num) {
                iteration = 0;
                break;
            }
        }

        //Reading the JSON files and converting them into JSON format
        const dataBuffer = fs.readFileSync(JSON_PATH);
        const dataJson = dataBuffer.toString();
        const data = JSON.parse(dataJson);

        //add json object to add videos to later
        const video_template = { date: "", month: "", day: "", year: "", id:accountName, videos: [] }
        data[accountName].video_array.unshift(video_template);

        //Adding date to the date category
        let dateobject = new Date();

        data[accountName].video_array[0].date = Date();
        data[accountName].video_array[0].month = dateobject.getMonth() + 1;
        data[accountName].video_array[0].day = dateobject.getDate();
        data[accountName].video_array[0].year = dateobject.getFullYear();
        data[accountName].video_array[0].videos = videos;

        //write files to the system
        fs.writeFile(JSON_PATH, JSON.stringify(data), (err) => {
            if (err) {
                console.error(err);}
            else{
                console.log(chalk.black.bgYellowBright('💾 The file has been saved!' + '\n'));
            }
        });


    },

    readfile: async () => {
        const dataBuffer = fs.readFileSync(JSON_PATH);
        const dataJson = dataBuffer.toString();
        const data = JSON.parse(dataJson);
        console.log(data[1].url);
        debugger;

    },

    end: async () => {
        await browser.close();
    }

}

module.exports = theirtube;
