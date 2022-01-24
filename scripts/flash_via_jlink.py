#! /usr/bin/env python3

from pathlib import Path
import sys
import os
import subprocess
import shlex

device="ATSAMD21E18A"
board = None
if "BOARD" in os.environ:
    board = os.environ["BOARD"]
if len(sys.argv)>1:
    board = sys.argv[1]
if board is None:
    print("please specify the board: flash_via_jlink.py 2s_charger")
    sys.exit(2)

def find_latest_file(board: str) -> Path:
    build_folder = Path(__file__) / ".." / ".." / "build" / board
    return sorted(build_folder.glob("bootloader-*.bin"), reverse=True)[0].resolve()

file_to_flash = find_latest_file(board)


if input(f"about to flash {file_to_flash}\ncontinue? (Y/n)").lower().startswith("n"):
    sys.exit(1)

commands = f"""
ExitOnError 1
selectinterface swd
speed auto
connect
//display userrow
mem8 0x804000 0x10
//remove boot protection
w1 0x804000 0xff
r
erase
loadfile {file_to_flash}
// write default userrow with 8k boot protection
w4 0x804000 0xd8e0c7fa
w4 0x804004 0xfffffc5d
w4 0x804008 0xffffffff
w4 0x80400c 0xffffffff
r
mem8 0x804000 0x10
exit
"""
cmdpath = Path(__file__) / ".." / "flash_via_jlink.jlink"
cmdpath = cmdpath.resolve()
try:
    with open(cmdpath, "w", encoding="utf-8") as f:
        f.write(commands)

    result = subprocess.run(shlex.split(f"JLink.exe -device {device} -CommandFile {cmdpath}", posix=False))
    if result.returncode != 0:
        print(f"JLink failed with exit code {result.returncode}")
    else:
        print("Jlink was successful :)")
finally:
    cmdpath.unlink()
