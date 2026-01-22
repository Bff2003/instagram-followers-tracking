import puppeteer, { Page, Browser } from 'puppeteer-core';
import readline from "readline/promises";
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

function createPathIfNotExist(path: string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
}

export class InstagramBot {
    private browserPath: string | null;
    private browser!: Browser;
    private page!: Page;
    private rl1!: readline.Interface;
    private loggedIn: boolean = false;

    private static sleepTime = 5 * 1000;
    private static scriptPath = 'script.js';

    constructor(browserPath: string | null = null) {
        this.browserPath = process.env.BROWSER_PATH || browserPath || null;
        if (this.browserPath === null) {
            throw new Error('Edge path not found');
        }
    }

    async init() {
        this.rl1 = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // set configs
        const puppeterOptions = {
            headless: false,
            args: ['--no-sandbox'],
            executablePath: this.browserPath!,
            devtools: true,
        };

        this.browser = await puppeteer.launch(puppeterOptions);
        this.page = await this.browser.newPage();
        this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36');
    }

    async login(loadCookies: boolean = true, saveCookies: boolean = true) {
        await this.page.goto('https://www.instagram.com/');
        if (loadCookies && fs.existsSync('cookies.json')) {
            const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf-8'));
            await this.page.setCookie(...cookies);
            await this.page.reload();
        } else {
            await this.rl1.question('Please login to instagram and press any key to continue...\n');
            if (saveCookies) {
                const cookies = await this.page.cookies();
                fs.writeFileSync('cookies.json', JSON.stringify(cookies));
            }
        }

        // sleep 5 seconds
        await new Promise(resolve => setTimeout(resolve, InstagramBot.sleepTime));
        this.loggedIn = true;
    }

    async runScript(user_name: string, filename: string | null = null) {
        filename = filename || user_name + '_' + Date.now() + ".json";

        let data = fs.readFileSync(InstagramBot.scriptPath, 'utf-8');
        data = data.replace('new_user_template', user_name)
        data = data.replace('FILE_NAME', filename);

        await new Promise(resolve => setTimeout(resolve, InstagramBot.sleepTime));
        await this.page.evaluate(data);
        await new Promise(resolve => setTimeout(resolve, InstagramBot.sleepTime));

        return filename;
    }

    async close() {
        await this.browser.close();
        this.rl1.close();
    }

    async main(users: string[]) {
        await this.init();
        await this.login();

        if (!this.loggedIn) {
            throw new Error('Please do the login in your account first\n');
        }

        for (const username of users) {
            const filename = await this.runScript(username);
            const downloadPath = path.join(os.homedir(), 'Downloads', filename);
            let data = fs.readFileSync(downloadPath, 'utf-8');
            createPathIfNotExist(path.join('.\\data\\' + username + '\\new\\'));
            fs.writeFileSync(path.join('.\\data\\' + username + '\\new\\' + filename), data);
            fs.unlinkSync(downloadPath);
            console.log(`Downloaded ${filename}`);
            await new Promise(resolve => setTimeout(resolve, InstagramBot.sleepTime));
        }

        await this.close();
    }
}

if (require.main === module) {
    (async () => {
        const bot = new InstagramBot();
        await bot.main(["YOUR-USER-HERE"]);
    })();
}