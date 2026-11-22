const execFileAsync = promisify(execFile);
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "./logger.js";

export async function tapScreen(
    x: number,
    y: number
): Promise<void> {
    logger.debug(`Tap screen: X=${x} Y=${y}`);
    await execFileAsync("adb", [
        "shell",
        "input",
        "tap",
        String(x),
        String(y)
    ]);
}

export async function holdScreen(
    x: number,
    y: number,
    duration: number
): Promise<void> {
    logger.debug(`Hold screen: X=${x} Y=${y} Duration=${duration}ms`);
    await execFileAsync("adb", [
        "shell",
        "input",
        "swipe",
        String(x),
        String(y),
        String(x),
        String(y),
        String(duration)
    ]);
}