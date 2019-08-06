import { StartPollingForFindingUserMentions } from './twitter/poller'

async function test(){

    let screenName = await StartPollingForFindingUserMentions()
    console.log(screenName)

}


test()
