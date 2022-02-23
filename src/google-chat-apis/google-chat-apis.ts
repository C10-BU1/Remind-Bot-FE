import { config } from 'dotenv';
import { google } from 'googleapis'
import axios from 'axios'
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { MemberEntity } from 'src/modules/member/member.entity';
import { MemberInfoDto } from 'src/modules/member/dto/member-info.dto';
import * as moment from 'moment';
config();

const getJWT = async () => {

    const jwtClient = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), ['https://www.googleapis.com/auth/chat.bot']
    );
    try {
        const token = await jwtClient.authorize();
        console.log(token)
        return token.access_token;
    } catch (error) {
        return 0;
    }
}

export const getSpaces = async () => {
    try {
        const accessToken = await getJWT();
        const res = await axios.get(`https://chat.googleapis.com/v1/spaces`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        return res.data;
    } catch (error) {
        return 0;
    }
}

export const getMembersInSpace = async (spaceName: string) => {
    try {
        const accessToken = await getJWT();
        const res = await axios.get(`https://chat.googleapis.com/v1/${spaceName}/members`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        return res.data.memberships;
    } catch (error) {
        return 0;
    }
}

export const getMessage = async (messageName: string) => {
    try {
        const accessToken = await getJWT();
        const res = await axios.get(`https://chat.googleapis.com/v1/${messageName}`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        return res.data.argumentText;
    } catch (error) {
        Logger.error(error);
        return 0;
    }
}

export const createMessage = async (message: string, members: MemberInfoDto[], spaceName: string, threadId: string) => {
    const date = moment(new Date()).utcOffset('+0700').format('DD-MM');
    let messageWithTag = message.replace('{date}', date);
    for (let member of members) {
        if(member.name == 'all'){
            messageWithTag = messageWithTag.replace('@all','<users/all>')
        }
        messageWithTag = messageWithTag.replace(`@${member.displayName}`, `<${member.name}>`);
    }
    const data = {
        text: messageWithTag,
        thread: {
            name: threadId
        }
    }
    try {
        const accessToken = await getJWT();
        const res = await axios.post(`https://chat.googleapis.com/v1/${spaceName}/messages`, data, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        })
        return res.data;
    } catch (error) {
        return 0;
    }
}

export const createMessageForReminderNotification = async (message: string, members: MemberInfoDto[], allTaggedMember: MemberInfoDto[], spaceName: string, threadId: string) => {
    let messageWithTag = message;
    for (let member of members) {
        messageWithTag = messageWithTag.replace(`@${member.displayName}`, `<${member.name}>`);
    }
    for(let member of allTaggedMember){
        messageWithTag = messageWithTag.replace(`@${member.displayName}`, ``);
    }
    const data = {
        text: messageWithTag,
        thread: {
            name: threadId
        }
    }
    try {
        const accessToken = await getJWT();
        const res = await axios.post(`https://chat.googleapis.com/v1/${spaceName}/messages`, data, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        })
        return res.data;
    } catch (error) {
        return 0;
    }
}


