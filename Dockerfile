FROM mhart/alpine-node
COPY . /opt/semantics3
WORKDIR /opt/semantics3
# RUN npm i --save
CMD npm start
