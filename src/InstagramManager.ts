import fs from 'fs';
import path from 'path';

interface InstagramUser {
    username: string;
    full_name: string;
}

interface InstagramData {
    followers: InstagramUser[];
    followings: InstagramUser[];
    dontFollowMeBack: InstagramUser[];
    iDontFollowBack: InstagramUser[];
    mutuals: InstagramUser[];
}

interface DiffResult {
    new: string[];
    removed: string[];
    same?: string[];
}

interface TrackingEntry {
    last: string;
    now: string;
    followers: DiffResult;
    unfollowers: DiffResult;
    mutuals: DiffResult;
    dontFollowMeBack: DiffResult;
    iDontFollowBack: DiffResult;
}

interface TrackingData {
    tracking: TrackingEntry[];
}

export class InstagramManager {
    private static dataPath: string = path.join("./data");

    constructor() {
        if (!fs.existsSync(InstagramManager.dataPath)) {
            fs.mkdirSync(InstagramManager.dataPath, { recursive: true });
        }
    }

    async init() {

    }

    private getDiffLists(newList: InstagramUser[], oldList: InstagramUser[], returnSame: boolean = false, onlyUsernames: boolean = true): DiffResult {
        const newUsernames = new Set(newList.map(u => u.username));
        const oldUsernames = new Set(oldList.map(u => u.username));

        let novos = newList.filter(user => !oldUsernames.has(user.username));
        let removidos = oldList.filter(user => !newUsernames.has(user.username));
        let iguais = newList.filter(user => oldUsernames.has(user.username));

        if (onlyUsernames) {
            return {
                new: novos.map(u => u.username),
                removed: removidos.map(u => u.username),
                same: returnSame ? iguais.map(u => u.username) : undefined
            };
        } else {
            return {
                new: novos.map(u => u.username),
                removed: removidos.map(u => u.username),
                same: returnSame ? iguais.map(u => u.username) : undefined
            };
        }
    }

    async process(users: string[]) {
        for (const user of users) {
            const userPath = path.join(InstagramManager.dataPath, user);
            const userNewPath = path.join(userPath, 'new');
            const userOutPath = path.join(userPath, 'out');
            const trackingFile = path.join(userPath, 'tracking.json');

            if (!fs.existsSync(userNewPath)) {
                console.log("User " + user + " new folder missing, skipping");
                continue;
            }
            if (!fs.existsSync(userOutPath)) {
                fs.mkdirSync(userOutPath, { recursive: true });
            }

            if (!fs.existsSync(trackingFile)) {
                fs.writeFileSync(trackingFile, JSON.stringify({ tracking: [] }, null, 4));
            }

            const files = fs.readdirSync(userNewPath);
            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                try {
                    const inFilePath = path.join(userNewPath, file);
                    console.log(`Processing file: ${inFilePath}`);

                    const data: InstagramData = JSON.parse(fs.readFileSync(inFilePath, 'utf-8'));

                    let trackingFileContent: any;
                    try {
                        trackingFileContent = JSON.parse(fs.readFileSync(trackingFile, 'utf-8'));
                    } catch (e) { trackingFileContent = {}; }

                    if (!trackingFileContent.tracking || !Array.isArray(trackingFileContent.tracking)) {
                        trackingFileContent = { tracking: [] };
                    }
                    const trackingData = trackingFileContent as TrackingData;

                    const now = new Date();
                    const nowStr = now.toISOString().replace(/T/, 'T').replace(/\..+/, '').replace(/:/g, '-');

                    const outFiles = fs.readdirSync(userOutPath).sort();

                    if (outFiles.length === 0) {
                        const outFileName = nowStr + ".json";
                        fs.copyFileSync(inFilePath, path.join(userOutPath, outFileName));
                        outFiles.push(outFileName);
                    }

                    const lastOutFile = outFiles[outFiles.length - 1];
                    const pastRunFilePath = path.join(userOutPath, lastOutFile);
                    console.log(`Most recent out file: ${pastRunFilePath}`);

                    const pastRunData: InstagramData = JSON.parse(fs.readFileSync(pastRunFilePath, 'utf-8'));

                    const newEntry: TrackingEntry = {
                        last: path.basename(pastRunFilePath, '.json'),
                        now: nowStr,
                        followers: this.getDiffLists(data.followers, pastRunData.followers),
                        unfollowers: this.getDiffLists(data.followings, pastRunData.followings),
                        mutuals: this.getDiffLists(data.mutuals, pastRunData.mutuals),
                        dontFollowMeBack: this.getDiffLists(data.dontFollowMeBack, pastRunData.dontFollowMeBack),
                        iDontFollowBack: this.getDiffLists(data.iDontFollowBack, pastRunData.iDontFollowBack)
                    };

                    trackingData.tracking.unshift(newEntry);

                    fs.writeFileSync(trackingFile, JSON.stringify(trackingData, null, 4));

                    const finalOutFileName = nowStr + ".json";
                    fs.copyFileSync(inFilePath, path.join(userOutPath, finalOutFileName));

                    fs.unlinkSync(inFilePath);
                } catch (error) {
                    console.error(`Error processing file ${file}:`, error);
                }
            }
        }
    }

    async close() {

    }
}

if (require.main === module) {
    const manager = new InstagramManager();
    manager.process(["bernardo_farrobinha"]).catch(console.error);
}