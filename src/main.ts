import { holdScreen, tapScreen } from "./utils/interaction.js";
import { isTombolAngkatExists, isTombolMancingExists, isTombolTarikExists } from "./utils/isTombolExists.js";
import { logger } from "./utils/logger.js";
import { printBanner } from "./utils/printBanner.js";
import { sleep } from "./utils/sleep.js";

/**
 * Type declaration
 */
type StateMancing = 'WAIT_FISHING' | 'WAIT_STRIKE' | 'FISHING' | 'FINISH_FISHING';

/**
 * Button position
 */
const BUTTON = {
    x: 2285,
    y: 901
};

const BUTTON_TARIK = {
    x: 2276,
    y: 748
};

const FREE_AREA = {
    x: 1982,
    y: 564
}

/**
 * Main function
 */
async function main(): Promise<void> {
    printBanner();
    await sleep(1000);

    while(true) {
        logger.verbose("START");
        let state: StateMancing = 'WAIT_FISHING';
    
        /**
         * Tombol Mancing
         */
        while(state == 'WAIT_FISHING') {

            // Ada tombol mancing?
            if (await isTombolMancingExists()) {
                logger.info("Tombol mancing ditemukan, coba memencet");
                await tapScreen(BUTTON.x, BUTTON.y);
                
                state = 'WAIT_STRIKE';
                await sleep(2000);
                break;
            } 
        }
    
        /**
         * Tombol Strike
         */
        while(state == 'WAIT_STRIKE') {

            // Bukan tombol angkat?
            if (!(await isTombolAngkatExists())) {
                logger.info("Tombol strike ditemukan, coba memencet");
                await tapScreen(BUTTON.x, BUTTON.y);
    
                state = 'FISHING';
                await sleep(1500);
                break;
            }
        }

        /**
         * Mancing
         */
       if(state = 'FISHING') {

            // Cek kalau legend keatas
            if (await isTombolTarikExists()) {
                logger.info("Tombol tarik ditemukan, mulai memancing");

                do {
                    await holdScreen(BUTTON_TARIK.x, BUTTON_TARIK.y, 300);
                    await sleep(100);

                    await holdScreen(BUTTON_TARIK.x, BUTTON_TARIK.y, 300);    
                    await sleep(100);

                    await holdScreen(BUTTON_TARIK.x, BUTTON_TARIK.y, 450);
                    await sleep(100);

                    await holdScreen(BUTTON_TARIK.x, BUTTON_TARIK.y, 1500);
                    await sleep(200);
                    
                    await holdScreen(BUTTON_TARIK.x, BUTTON_TARIK.y, 150);
                    await sleep(200);

                    await holdScreen(BUTTON_TARIK.x, BUTTON_TARIK.y, 150);
                    await sleep(200);

                    await holdScreen(BUTTON_TARIK.x, BUTTON_TARIK.y, 100);
                    await sleep(1500);

                } while (await isTombolTarikExists());

                state = 'FINISH_FISHING';

            } else {
                logger.warn("Tombol strike gagal dipencet, mengulang mancing");
                continue;
            } 
        }

        /**
         * Selesai Mancing
         */
        if (state == 'FINISH_FISHING') {
            logger.info("Mancing sukses");
            logger.verbose("END");
            await sleep(3000);
            await tapScreen(FREE_AREA.x, FREE_AREA.y);
            await sleep(500);
        }
    }
}

main();