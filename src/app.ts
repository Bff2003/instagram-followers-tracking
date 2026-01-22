import { InstagramBot } from "./InstagramBot";
import { InstagramManager } from "./InstagramManager";

(async () => {
    const users = ["YOUR-USER-HERE"];

    const bot = new InstagramBot();
    await bot.main(users);

    const manager = new InstagramManager();
    await manager.process(users);
})();