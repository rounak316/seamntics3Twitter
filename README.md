#   Plan of action
Since Twitter API have a rate limit, the plan is to schedule jobs for making all the API calls, instead of hitting them on realtime basis. The scheduler will handle rate limit, and work accordingly.
This microservice, would poll for all the unique jobs (checking if user is verified or not, getting tweets from twitter handle, etc.), and would schedule all the API calls, with a time gap, just to ensure API calls don't surpass the imposed rate limit.

Also, the design is in such a way, that this microservice could be replicated across cluster, bu providing access tokens, for unique accounts. In this way, the job would be distributed among the workers, and we would be able to optimize the API calls.

I have used mongo, for initialy dumping all the tweets from API calls, and managing life cycle of each worker and it' task. 
This would ensure, if some thing goes wrong (DB connectin fails, network drops out, etc), the microservice can be resumed from the last checkpoint, and save API calls, and other repetetive tasks.


Next plan is to create a pipeline, which would pipe all the user's required data, to elasticsearch. Then, API calls can directly communicate with elastic, for fetching tweets, for given time period and user name. 

Once, our data gets intact, MongoDB would be purged, so as to reduce data duplication.
Another plan is to use LogStash, to achieve this. But a simple script, to watch for chages, and do a bulk insertion query would work as well.


Once APIs are ready, POSTMAN Collection would be created!


# Tweet Challenge

Welcome to tweet challenge!! 

## Development Setup

To get elasticsearch up and running, just run the following command

```bash
docker-compose up -d
```

To start developing, install nvm, then node.js (v10.16.0)

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
```

Open $HOME/.zshrc or $HOME/.bashrc and add

```
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
```

and then run

```
exec bash (or)
exec zsh
```

Now install node.js

```
nvm install v10.16.0

➜  twitter-analysis git:(master) nvm use v10.16.0
Now using node v10.16.0 (npm v6.9.0)

➜  twitter-analysis git:(master) npx tsc --version
Version 3.3.3

npm install

npx tsc -w
```

Happy Hacking!

