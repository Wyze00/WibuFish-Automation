import { logger } from "./logger.js";

export function sleep(ms: number): Promise<void> {
    logger.debug(`Tidur selama ${ms}ms`);
    return new Promise(resolve => setTimeout(resolve, ms));
}