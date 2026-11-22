import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import cvModule from "@techstark/opencv-js";
import sharp from "sharp";
import { logger } from "./logger.js";

/**
 * Ini cv
 */
const cv = await cvModule;

/**
 * Constant
 */
const PNG_END = Buffer.from([
    0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44,
    0xAE, 0x42, 0x60, 0x82
]);

// Bagian kanan bawah layar
const SEARCH_REGION = {
    left: 1800,
    top: 600,
    width: 660,
    height: 480
};

interface CapturedFrame {
    data: Buffer;
    version: number;
    receivedAt: number;
}

class PersistentScreenshot {
    private process: ChildProcessWithoutNullStreams;
    private buffer = Buffer.alloc(0);

    private latestFrame?: Buffer;
    private frameVersion = 0;

    private latestFrameAt = 0;
    private previousFrameAt = 0;

    private lastDeliveredVersion = 0;
    private frameWaiters = new Set<() => void>();

    constructor() {
        this.process = spawn("adb", [
            "exec-out",
            "sh",
            "-c",
            "while true; do screencap -p; done"
        ]);

        this.process.stdout.on("data", (chunk: Buffer) => {
            this.buffer = Buffer.concat([
                this.buffer,
                chunk
            ]);

            this.extractFrames();
        });

        this.process.stderr.on("data", (data) => {
            logger.error("ADB:", data.toString());
        });

        this.process.on("error", (error) => {
            logger.error("ADB process error:", error);
        });
    }

    private extractFrames(): void {
        while (true) {
            const end = this.buffer.indexOf(PNG_END);

            if (end === -1) break;

            const frameEnd = end + PNG_END.length;
            const now = performance.now();

            if (this.previousFrameAt !== 0) {
                logger.debug(`Capture : ${(now - this.previousFrameAt).toFixed(2)} ms`);
            }

            this.previousFrameAt = now;

            this.latestFrame = Buffer.from(
                this.buffer.subarray(0, frameEnd)
            );

            this.frameVersion++;
            this.latestFrameAt = now;

            this.buffer = this.buffer.subarray(frameEnd);

            // Beritahu fungsi yang sedang menunggu frame baru
            for (const notify of this.frameWaiters) {
                notify();
            }
        }
    }

    private getLatestFrame(): CapturedFrame | null {
        if (!this.latestFrame) return null;

        return {
            data: this.latestFrame,
            version: this.frameVersion,
            receivedAt: this.latestFrameAt
        };
    }

    async waitForNextFrame(): Promise<CapturedFrame> {
        const current = this.getLatestFrame();

        // Jika sudah tersedia frame baru, langsung gunakan
        if (
            current &&
            current.version > this.lastDeliveredVersion
        ) {
            this.lastDeliveredVersion = current.version;
            return current;
        }

        // Jika belum ada frame baru, tunggu
        return new Promise((resolve) => {
            const notify = () => {
                const frame = this.getLatestFrame();

                if (
                    !frame ||
                    frame.version <= this.lastDeliveredVersion
                ) {
                    return;
                }

                this.lastDeliveredVersion = frame.version;

                this.frameWaiters.delete(notify);

                resolve(frame);
            };

            this.frameWaiters.add(notify);
            notify();
        });
    }

    close(): void {
        this.process.kill();
    }
}

const capture = new PersistentScreenshot();

export async function loadScreenshot(): Promise<cvModule.Mat> {
    const frame = await capture.waitForNextFrame();

    const { data, info } = await sharp(frame.data)
        .extract(SEARCH_REGION)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const mat = new cv.Mat(
        info.height,
        info.width,
        cv.CV_8UC3
    );

    mat.data.set(data);
    return mat;
}