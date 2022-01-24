FROM ubuntu:focal AS arm-download

WORKDIR /arm-none-eabi
ADD https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-x86_64-linux.tar.bz2 gcc-arm-none-eabi.tar.bz2
RUN tar xjf gcc-arm-none-eabi.tar.bz2
ENV PATH="/arm-none-eabi/gcc-arm-none-eabi-10.3-2021.10/bin:${PATH}"

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y build-essential git python2 openocd nodejs curl

WORKDIR /jlink
RUN curl 'https://www.segger.com/downloads/jlink/JLink_Linux_V760e_x86_64.deb' -X POST --data-raw 'accept_license_agreement=accepted&submit=Download+software' -o jlink.deb
RUN apt install -y --fix-broken ./jlink.deb

WORKDIR /uf2

