#!/usr/bin/env node
"use strict";

let logSym = "logStoreUF2"

let fs = require("fs")
let child_process = require("child_process")

function fatal(msg) {
    console.log("Fatal error:", msg)
    process.exit(1)
}

function main() {
    let fileName = process.argv[2]
    if (!fileName) {
    }

    let mode = ""

    if (/\.map$/.test(fileName)) mode = "map"
    else if (/\.bin$/.test(fileName)) mode = "bin"
    else if (/^server?$/.test(fileName)) mode = "server"
    else if (/^fuses?$/.test(fileName)) mode = "fuses"
    else {
        console.log("usage: node " + process.argv[1] + " file.bin    # to burn")
        console.log("usage: node " + process.argv[1] + " file.map    # to dump logs")
        console.log("usage: node " + process.argv[1] + " server      # to run gdb server")
        return
    }


    console.log("File: " + fileName)

    let addr = 0
    let logSize = 1024 * 4 + 4

    if (mode == "map") {
        let mapFile = fs.readFileSync(fileName, "utf8")
        for (let ln of mapFile.split(/\r?\n/)) {
            let m = /^\s*0x00000([0-9a-f]+)\s+(\S+)/.exec(ln)
            if (m && m[2] == logSym) {
                addr = parseInt(m[1], 16)
                break
            }
        }
        if (!addr) fatal(`Cannot find ${logSym} symbol in map file`)
    }

    let openocdBin = "/usr/bin/openocd"

    let cmd = `telnet_port disabled; init; halt; `
    if (mode == "map")
        cmd += `set M(0) 0; mem2array M 8 ${addr} ${logSize}; resume; parray M; shutdown`
    else
        cmd += `program ${fileName} verify reset; shutdown`

    let args = ["-d2",
        "-s", "/usr/share/openocd/scripts/",
        "-f", "interface/jlink.cfg",
        "-f", "target/at91samdXX.cfg",
        "-c", cmd]

    if (mode == "server") {
        args.pop()
        args.pop()
    }

    if (mode == "fuses") {
        args.pop()
        args.pop()
        args.push("-f")
        args.push("scripts/fuses.tcl")
    }

    console.log("Starting " + openocdBin + " " + args.join(" "))
    if (mode == "map")
        child_process.execFile(openocdBin, args, {
            maxBuffer: 1 * 1024 * 1024,
        }, (err, stdout, stderr) => {
            if (err) {
                fatal("error: " + err.message)
            }
            let buf = Buffer.alloc(logSize)
            for (let l of stdout.split(/\r?\n/)) {
                let m = /^M\((\d+)\)\s*=\s*(\d+)/.exec(l)
                if (m) {
                    buf[parseInt(m[1])] = parseInt(m[2])
                }
            }
            let len = buf.readUInt32LE(0)
            if (len == 0 || len > buf.length) {
                console.log(stderr)
                console.log("No logs.")
            } else {
                console.log("*\n* Logs\n*\n")
                console.log(buf.slice(4, 4 + len).toString("binary"))
            }
        })
    else {
        let proc = child_process.spawn(openocdBin, args, {
            stdio: "inherit"
        })
        proc.on("error", err => { throw err })
        proc.on("close", () => { })
    }
}

main()
