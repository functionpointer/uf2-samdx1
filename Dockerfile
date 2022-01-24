FROM ubuntu:focal AS arm-download

WORKDIR /arm-none-eabi
ADD https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-x86_64-linux.tar.bz2 gcc-arm-none-eabi.tar.bz2
RUN tar xjf gcc-arm-none-eabi.tar.bz2
ENV PATH="/arm-none-eabi/gcc-arm-none-eabi-10.3-2021.10/bin:${PATH}"

RUN apt-get update && apt-get install -y build-essential git python2 openocd nodejs

WORKDIR /uf2

