import { List, Avatar, Button } from "antd";
import { useState } from "react";
import styles from './Member.less';
import { updateRole } from "@/services/apis/memberApis";

export default function ListMember({ member, spaceId }: any) {
    const [isAdmin, setIsAdmin] = useState(false);

    const addAdmin = async () => {
        const data: API.UpdateRole = {
            spaceId: spaceId,
            memberId: member.id,
            role: 'admin'
        }
        await updateRole(data);
        setIsAdmin(true);
    }
    return (
        <>
            <List.Item key={member.id} style={{ marginLeft: 50 }}>
                <List.Item.Meta
                    avatar={<Avatar src={member.imageUrl} />}
                    title={<a href={member.href}>{member.displayName}</a>}
                    description={member.email}
                />
                {!isAdmin && <Button onClick={addAdmin} type="primary" style={{ marginRight: 200 }} className={styles.changeBtn}>Cấp quyền admin</Button>}
                {isAdmin && <Button style={{ marginRight: 200 }} className={styles.changeBtn}>Đã cấp quyền admin</Button>}
            </List.Item>
        </>
    )
}