import { config } from 'dotenv';
import { google } from 'googleapis'
import axios from 'axios'
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { MemberEntity } from 'src/modules/member/member.entity';
import { MemberInfoDto } from 'src/modules/member/dto/member-info.dto';
import * as moment from 'moment';
import { NotificationEntity } from 'src/modules/notification/notification.entity';
config();

const getJWT = async () => {

    const jwtClient = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), ['https://www.googleapis.com/auth/chat.bot']
    );
    try {
        const token = await jwtClient.authorize();
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

export const createMessage = async (notification: NotificationEntity, members: MemberInfoDto[], spaceName: string) => {
    const date = moment(new Date()).utcOffset('+0700').format('DD-MM');
    let messageWithTag = notification.content.replace('{date}', date);
    for (let member of members) {
        if (member.name == 'all') {
            messageWithTag = messageWithTag.replace('@all', '<users/all>')
        }
        messageWithTag = messageWithTag.replace(`@${member.displayName}`, `<${member.name}>`);
    }
    const data = {
        text: messageWithTag,
        thread: {
            name: notification.threadId == '' ? null : notification.threadId
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

export const createMessageForReminderNotification = async (notification: NotificationEntity, members: MemberInfoDto[], allTaggedMember: MemberInfoDto[], spaceName: string) => {
    let messageWithTag = notification.content;
    for (let member of members) {
        messageWithTag = messageWithTag.replace(`@${member.displayName}`, `<${member.name}>`);
    }
    for (let member of allTaggedMember) {
        messageWithTag = messageWithTag.replace(`@${member.displayName}`, ``);
    }
    const data = {
        text: messageWithTag,
        thread: {
            name: notification.threadId
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

export const simsimiApi = async (text: string): Promise<string> =>{
    try {
        const res = await axios.get(`https://simsimi.info/api/?text=${text}&lc=vn`);

        return res.data.success;
    } catch (error) {
        return text;
    }

}


