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

class PersistentScreenshot {
    private process: ChildProcessWithoutNullStreams;
    private buffer = Buffer.alloc(0);
    private latestFrame?: Buffer;
    private frameVersion = 0;

    constructor() {
        this.process = spawn("adb", [
            "exec-out",
            "sh",
            "-c",
            "while true; do screencap -p; sleep 0.075; done"
        ]);

        this.process.stdout.on("data", (chunk: Buffer) => {
            this.buffer = Buffer.concat([
                this.buffer,
                chunk
            ]);

            this.extractFrames();
        });

        this.process.stderr.on("data", (data) => {
            console.error("ADB:", data.toString());
        });

        this.process.on("error", (error) => {
            console.error("ADB process error:", error);
        });
    }

    private extractFrames(): void {
        while (true) {
            const end = this.buffer.indexOf(PNG_END);

            if (end === -1) break;

            const frameEnd = end + PNG_END.length;

            this.latestFrame = Buffer.from(
                this.buffer.subarray(0, frameEnd)
            );

            this.frameVersion++;

            this.buffer = this.buffer.subarray(frameEnd);
        }
    }

    getFrame(): {
        data: Buffer;
        version: number;
    } | null {
        if (!this.latestFrame) return null;

        return {
            data: this.latestFrame,
            version: this.frameVersion
        };
    }

    close(): void {
        this.process.kill();
    }
}

const capture = new PersistentScreenshot();

export async function loadScreenshot(): Promise<cvModule.Mat> {
    const frame = capture.getFrame();

    if (frame) {
        
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

    } else {
        logger.error("Gagal screenhshot");
        process.exit(1);
    }
}