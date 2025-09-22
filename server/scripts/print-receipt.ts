import net from "node:net";

function toEscPosBuffer(text: string, options?: { addInit?: boolean; addCut?: boolean }) {
    const { addInit = true, addCut = true } = options || {};
    const init = Buffer.from([0x1b, 0x40]); // ESC @
    const body = Buffer.from(text, "ascii");
    const lineFeeds = Buffer.from("\n\n\n", "ascii");
    // Try full cut (GS V 0) first; many printers accept it. Some prefer GS V 65 0
    const cut = Buffer.from([0x1d, 0x56, 0x00]);
    return Buffer.concat([
        addInit ? init : Buffer.alloc(0),
        body,
        lineFeeds,
        addCut ? cut : Buffer.alloc(0),
    ]);
}

function parseArgs() {
    const args = process.argv.slice(2);
    let ip = "";
    let port = 9100;
    let text = "TEST RECEIPT\nHello from ProSaleManager";
    let noInit = false;
    let noCut = false;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--ip" && i + 1 < args.length) {
            ip = args[++i];
        } else if ((arg === "--port" || arg === "-p") && i + 1 < args.length) {
            port = Number(args[++i]);
        } else if (arg === "--text" && i + 1 < args.length) {
            text = args[++i];
        } else if (arg === "--file" && i + 1 < args.length) {
            const fs = require("node:fs");
            text = fs.readFileSync(args[++i], "utf8");
        } else if (arg === "--no-init") {
            noInit = true;
        } else if (arg === "--no-cut") {
            noCut = true;
        } else if (arg === "--help" || arg === "-h") {
            printHelp();
            process.exit(0);
        }
    }

    if (!ip) {
        console.error("Error: --ip PRINTER_IP is required");
        printHelp();
        process.exit(1);
    }

    return { ip, port, text, addInit: !noInit, addCut: !noCut } as const;
}

function printHelp() {
    console.log(`Usage: tsx scripts/print-receipt.ts --ip 192.168.1.50 [options]\n\nOptions:\n  --ip <addr>        Printer IP address (required)\n  --port, -p <n>     TCP port (default 9100)\n  --text <str>       Text to print (use "\\n" for newlines)\n  --file <path>      Read print data from file (overrides --text)\n  --no-init          Do not send ESC @ init\n  --no-cut           Do not send cut command\n  --help, -h         Show this help\n`);
}

async function main() {
    const { ip, port, text, addInit, addCut } = parseArgs();
    const socket = new net.Socket();

    const data = toEscPosBuffer(text, { addInit, addCut });

    await new Promise<void>((resolve, reject) => {
        socket.setTimeout(8000);
        socket.once("timeout", () => reject(new Error("Connection timed out")));
        socket.once("error", reject);
        socket.connect(port, ip, () => {
            socket.write(data);
            socket.end();
        });
        socket.once("close", () => resolve());
    });

    console.log("Print job sent successfully.");
}

main().catch((err) => {
    console.error("Failed to print:", err?.message || err);
    process.exit(1);
});
