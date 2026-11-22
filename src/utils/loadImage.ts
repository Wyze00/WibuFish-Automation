import cvModule from "@techstark/opencv-js";
import sharp from "sharp";
import { logger } from "./logger.js";

/**
 * Ini cv
 */
const cv = await cvModule;

export async function loadImage(path: string): Promise<cvModule.Mat> {
    try {
        const { data, info } = await sharp(path)
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
    } catch (error) {
        logger.error(`Gagal load image : ${path}`);
        process.exit(1);
    }
}