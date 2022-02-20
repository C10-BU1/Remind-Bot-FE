import { PageContainer } from "@ant-design/pro-layout";
import { Card, Descriptions, Row, Col, List, Input, Button, Modal, Radio, Space, Avatar, Skeleton, Divider } from "antd";
import { useEffect, useState } from "react";
import CreateNotification from "@/components/Notification/CreateNotification/CreateNotification";
import Member from "@/components/Member/Member";
import { useParams } from "umi";
import styles from './SpaceDetail.less';
import { getSpaceInfo } from "@/services/apis/spaceApis";
import { getNotifications, searchNotificationByName } from "@/services/apis/notificationApis";
import ListNotification from "@/components/Notification/ListNotification";
import InfiniteScroll from 'react-infinite-scroll-component';
import NormalNotificationDetail from "@/components/Notification/NormalNotificationDetail";
import { getNotification } from "@/services/apis/notificationApis";
import NoFoundPage from "@/pages/404";
import ReminderNotificationDetail from "@/components/Notification/ReminderNotificationDetail";
export default function SpaceDetail() {
    const { spaceId }: any = useParams();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [notificationCate, setNotificationCate] = useState(0);
    const [choseCate, setChoseCate] = useState(0);
    const [notifications, setNotifications] = useState<any>([]);
    const [role, setRole] = useState('');
    const [spaceDetail, setSpaceDetail] = useState<API.SpaceDetail>();
    const { Search } = Input;
    const [currentPageNoti, setCurrentPageNoti] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [totalNotification, setTotalNotification] = useState(0);
    const [search, setSearch] = useState('');
    const [notificationDetail, setNotificationDetail] = useState<any>(null);
    const [isError, setIsError] = useState(false);
    const onSearch = async (value: string, e: any) => {
        const res = await searchNotificationByName(spaceId, value, 1);
        setNotifications(res.data.data);
        setSearch(value);
        setTotalNotification(res.data.total);
    }
    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleOk = () => {
        setRole('');
        setNotificationDetail(null);
        setChoseCate(notificationCate);
        setIsModalVisible(false);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };
    const handleGetDataFromChild = async (notificationId: number, action: string, type: string) => {
        if (action == 'delete') {
            const removedList = notifications.filter((notification: any) => {
                return notificationId != notification.id;
            })
            setNotifications([...removedList]);
            setTotalNotification(totalNotification - 1);
        }
        if (action == 'update') {
            if (type == 'normal') {
                const res = await getNotification(notificationId);
                setNotificationDetail(res.data);
            } else {
                const res = await getNotification(notificationId);
                setNotificationDetail(res.data);
            }
            setRole('');
            setChoseCate(0);
        }
        if (action == 'create') {
            const res = await getNotifications(spaceId, currentPageNoti);
            setNotifications(res.data.data);
            setTotalNotification(res.data.total);
        }

    }

    const ownerModal = () => {
        Modal.info({
            title: 'Owner',
            content: (
                <div>
                    <Row>
                        <Col span={20} push={4}>
                            <h4>{spaceDetail?.owner?.displayName}</h4>
                        </Col>
                        <Col span={4} pull={20}>
                            <Avatar src={`${spaceDetail?.owner?.imageUrl}`} />
                        </Col>
                    </Row>,
                </div>
            ),
            onOk() { },
        });
    }
    useEffect(() => {
        const spaceInfo = async () => {
            try {
                const res = await getSpaceInfo(spaceId);
                setSpaceDetail(res.data);
            } catch (error) {
                setIsError(true)
            }
        }
        spaceInfo();
    }, [])

    const loadMoreData = async () => {
        if (isLoading) {
            return;
        }
        setCurrentPageNoti(currentPageNoti + 1);
    }

    useEffect(() => {
        const notification = async () => {
            const res = await getNotifications(spaceId, currentPageNoti);
            setNotifications([...notifications, ...res.data.data])
            if (totalNotification == 0) {
                setTotalNotification(res.data.total);
            }
        }
        const searchNoti = async () => {
            const res = await searchNotificationByName(spaceId, search, currentPageNoti);
            setNotifications([...notifications, ...res.data.data])
            setTotalNotification(res.data.total);
        }
        setIsLoading(true);
        if (search == '') {
            notification();
        } else {
            searchNoti();
        }
        setIsLoading(false);
    }, [currentPageNoti])

    return (
        <div>
            {isError ? <NoFoundPage /> : <PageContainer
                fixedHeader
                header={{
                    title: `${spaceDetail?.displayName}`,
                }}
                content={
                    <Descriptions column={4} style={{ marginBottom: -16 }}>
                        <Descriptions.Item label="Owner">
                            <a onClick={ownerModal}>{spaceDetail?.owner?.displayName}</a>
                        </Descriptions.Item>
                        <Descriptions.Item label="Admin">
                            <a onClick={(e) => { setRole('admin'); setChoseCate(0); setNotificationDetail(null) }} >{spaceDetail?.admin}</a>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thành viên">
                            <a onClick={(e) => { setRole('member'); setChoseCate(0); setNotificationDetail(null) }}>{spaceDetail?.member}</a>
                        </Descriptions.Item>
                        <Descriptions.Item>
                            <Button className={styles.spaceDetailBtn} onClick={showModal}>
                                Tạo thông báo
                            </Button>
                        </Descriptions.Item>

                    </Descriptions>
                }
            >
                <Card>
                    <Row className={styles.spaceDetailContainer}>
                        <Col span={18} push={6} className={styles.rightContain}>
                            {choseCate != 0 && <CreateNotification notificationCate={choseCate} spaceId={spaceId} sendData={handleGetDataFromChild} />}
                            {role != '' && <Member role={role} spaceId={spaceId} />}
                            {notificationDetail != null && notificationDetail.type == 'normal' && <NormalNotificationDetail notification={notificationDetail} spaceId={spaceId} sendData={handleGetDataFromChild} />}
                            {notificationDetail != null && notificationDetail.type == 'reminder' && <ReminderNotificationDetail notification={notificationDetail} spaceId={spaceId} sendData={handleGetDataFromChild} />}
                        </Col>
                        <Col span={6} pull={18} className={styles.leftContain}>
                            <Search placeholder="Tìm kiếm thông báo" onSearch={onSearch} enterButton className={styles.leftSearch} />
                            <div
                                id="scrollableDiv"
                                style={{
                                    height: 600,
                                    overflow: 'auto',
                                }}
                            >
                                <InfiniteScroll
                                    dataLength={notifications.length}
                                    next={loadMoreData}
                                    hasMore={notifications.length < totalNotification - 1}
                                    loader={<Skeleton paragraph={{ rows: 1 }} active />}
                                    endMessage={<Divider plain>Cuối trang</Divider>}
                                    scrollableTarget="scrollableDiv"
                                >
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={notifications}
                                        renderItem={item => (
                                            <>
                                                {notifications.length != 0 && <ListNotification notification={item} sendData={handleGetDataFromChild} />}
                                            </>
                                        )}
                                    />
                                </InfiniteScroll>
                            </div>
                        </Col>
                    </Row>

                </Card>
                <Modal title="Chọn loại thông báo" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
                    <Radio.Group onChange={e => setNotificationCate(e.target.value)} value={notificationCate}>
                        <Space direction="vertical">
                            <Radio value={1}>Thông báo bình thường</Radio>
                            <Radio value={2}>Thông báo nhắc nhở</Radio>
                        </Space>
                    </Radio.Group>
                </Modal>

            </PageContainer>}

        </div>
    )
}