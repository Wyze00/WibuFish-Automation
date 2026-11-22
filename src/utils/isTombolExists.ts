import { loadImage } from "./loadImage.js";
import cvModule from "@techstark/opencv-js";
import { loadScreenshot } from "./loadScreenshot.js";
import { logger } from "./logger.js";

/**
 * Init cv & constant
 */
const cv = await cvModule;
const THRESHOLD = 0.95;
const THRESHOLD_TOMBOL_MANCING = 0.9;

/**
 * Load all template assets
 */
const tombolMancing = await loadImage("assets/mancing.png");
// const tombolMancingTitik = await loadImage("assets/mancing-titik.png");
const tombolMancingAngkat = await loadImage("assets/mancing-angkat.png");
// const tombolMancingStrike = await loadImage("assets/mancing-strike.png");
// const tombolMancingEpik = await loadImage("assets/mancing-epik.png");
const tombolMancingTarik = await loadImage("assets/mancing-tarik.png");

function createCircularMask(
    width: number,
    height: number
): cvModule.Mat {

    const mask = cv.Mat.zeros(
        height,
        width,
        cv.CV_8UC1
    );

    const center = new cv.Point(
        Math.floor(width / 2),
        Math.floor(height / 2)
    );

    const radius = Math.floor(
        Math.min(width, height) / 2
    );

    cv.circle(
        mask,
        center,
        radius,
        new cv.Scalar(255),
        -1
    );

    return mask;
}

async function isTombolExists(tombol: cvModule.Mat, threshold: number): Promise<boolean> {
    const screenshot = await loadScreenshot();
    const result = new cv.Mat();
    const mask = createCircularMask(
        tombol.cols,
        tombol.rows
    );

    try {
        cv.matchTemplate(
            screenshot,
            tombol,
            result,
            cv.TM_CCORR_NORMED,
            mask
        );

        const match = cv.minMaxLoc(result);
        logger.debug(`Similarity : ${match.maxVal}`);
        return match.maxVal >= threshold;

    } finally {
        screenshot.delete();
        result.delete();
        mask.delete();
    }
}

export async function isTombolMancingExists(): Promise<boolean> {
    return await isTombolExists(tombolMancing, THRESHOLD_TOMBOL_MANCING);
}

export async function isTombolAngkatExists(): Promise<boolean> {
    return await isTombolExists(tombolMancingAngkat, THRESHOLD);
}

export async function isTombolTarikExists(): Promise<boolean> {
    return await isTombolExists(tombolMancingTarik, THRESHOLD);
}