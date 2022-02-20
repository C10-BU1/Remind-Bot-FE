import { Button, List, message, Popconfirm, Popover } from "antd";
import { useEffect, useState } from "react";
import styles from './Notification.less';
import { updateStatus } from "@/services/apis/notificationApis";
import { MoreOutlined } from "@ant-design/icons";
import { deleteNotification } from "@/services/apis/notificationApis";
export default function ListNotification({ notification, sendData }: any) {
    const [isEnable, setIsEnable] = useState(false);
    const handleStatusChange = async (e: any, isEnable: boolean) => {
        setIsEnable(isEnable);
        const data = { id: notification.id, isEnable: isEnable };
        await updateStatus(data);
    }
    const handleUpdate = () => {
        sendData(notification.id, 'update', notification.type);
    }

    const confirm = async () => {
        const res = await deleteNotification(notification.id);
        sendData(res.data.notificationId, 'delete', notification.type);
        message.success('1 thông báo đã được xóa');
    }
    useEffect(() => {
        setIsEnable(notification.isEnable);
    },[notification]);
    const content = (
        <div>
            <Button type="text" onClick={handleUpdate}>
                Cập nhật
            </Button>
            <Popconfirm placement="topLeft" okText="Yes" cancelText="No" title={'Xóa thông báo này?'} onConfirm={confirm}>
                <Button danger type="text" >
                    Xóa
                </Button>
            </Popconfirm>
        </div>
    );
    return (
        <>
            <List.Item className={styles.listNotification}>
                <List.Item.Meta
                    title={<a onClick={handleUpdate}><p className={styles.notificationName} >{notification.name}</p></a>}
                />
                {isEnable ? <Button onClick={(e) => handleStatusChange(e, !isEnable)}>Tắt</Button> : <Button onClick={(e) => handleStatusChange(e, !isEnable)} type="primary">Bật</Button>}
                <Popover placement="right" content={content}>
                    <MoreOutlined />
                </Popover>
            </List.Item>
        </>
    )
}