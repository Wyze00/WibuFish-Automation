import CFonts from "cfonts";
import { logger } from "./logger.js";

const banners = [
    {
        font: "block",
        gradient: ["#FFB7B2", "#B2CEFE"],
    },
    {
        font: "chrome",
        gradient: ["#00C9FF", "#92FE9D"],
    },
    {
        font: "simple",
        gradient: ["#F6D365", "#FDA085"],
    },
    {
        font: "shade",
        gradient: ["#A18CD1", "#FBC2EB"],
    },
    {
        font: "3d",
        gradient: ["#84FAB0", "#8FD3F4"],
    },
];

export function printBanner() {
    logger.debug("Print Banner");

    const index = Math.floor(Math.random() * banners.length);
    const banner = banners[index];

    if (!banner) {
        logger.error(`Tidak ada banner dengan index ${index}`);
        process.exit(1);
    }

    CFonts.say("WibuFish|Automation", {
        font: banner.font,
        align: "center",
        colors: ["system"],
        background: "transparent",
        letterSpacing: 1,
        space: true,
        gradient: banner.gradient,
    });
}

