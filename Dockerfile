FROM ubuntu

ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update \
    && apt-get install curl vim -y \
    && mkdir -p /workspace/docker/zipanda/api

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash - \
    && apt-get install nodejs nginx mysql-client -y
RUN apt-get install php-mysql php-fpm php-cli php-mbstring php-curl php-gd -y 
RUN apt install php7.4-intl -y

RUN npm install -g express nodemon

WORKDIR /workspace/docker/zipanda/api