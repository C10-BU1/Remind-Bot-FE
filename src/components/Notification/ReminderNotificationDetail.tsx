import { searchMemberByDisplayName } from "@/services/apis/memberApis";
import { updateNotification } from "@/services/apis/notificationApis";
import ProForm, { ProFormText, ProFormTimePicker, ProFormCheckbox, ProFormDatePicker } from "@ant-design/pro-form";
import { FooterToolbar } from "@ant-design/pro-layout";
import { Card, Button, Spin, message, Row, Col, Mentions, Radio, Form } from "antd";
import form from "antd/lib/form";
import moment from "moment";
import { useState, useEffect } from "react";
import { UpdateNotification } from "./dto/update-notification.dto";
import styles from './Notification.less';
const { Option } = Mentions;


export default function ReminderNotificationDetail({ notification, spaceId, sendData }: any) {
    const [taggedMember, setTaggedMember] = useState<any>([]);
    const [searchMembers, setSearchMember] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [form] = Form.useForm();
    const [content, setContent] = useState('');
    const onChange = (value: any) => {
        setContent(value);
    }
    const onSelect = (option: any) => {
        const findTag = taggedMember.filter((tag: any) => {
            return tag.name == option.key
        })
        if (findTag.length == 0) {
            setTaggedMember([...taggedMember, { name: option.key, displayName: option.value }]);
        }
    }

    const onSearchMember = async (search: string) => {
        setIsLoading(true)
        const res = await searchMemberByDisplayName(spaceId, search);
        setSearchMember(res.data);
        setIsLoading(false);
    }


    useEffect(() => {
        setTaggedMember(notification.tags);
        setContent(notification.content);
        form.resetFields();
    }, [notification])

    return (
        <>
            <Card style={{ border: "none" }}>
                <ProForm
                    form={form}
                    submitter={{
                        searchConfig: {
                            submitText: 'Cập nhật',
                        },
                        resetButtonProps: {
                            style: {
                                // Hide the reset button
                                display: 'none',
                            },

                        },
                        render: (props, dom) =>
                            <FooterToolbar>
                                {!isLoading ?
                                    <Button type="primary" onClick={() => props.form?.submit()}>Cập nhật </Button> :
                                    <Button type="primary" disabled ><Spin /></Button>}
                            </FooterToolbar>,
                    }}

                    onFinish={async (values) => {
                        setIsLoading(true);
                        if (content == '') {
                            message.warning('Nội dung không được để trống');
                            return;
                        }
                        const time = moment(values.time, 'hh:mm:ss');
                        let hour = moment(time).format('k');
                        let minute = moment(time).format('m');

                        const data = new UpdateNotification();
                        data.id = notification.id;
                        if (notification.content != content) {
                            data.content = content;
                        }
                        if (notification.name != values.name) {
                            data.name = values.name;
                        }
                        if (notification.threadId != values.threadId) {
                            data.threadId = values.threadId;
                        }
                        if (notification.hour != hour) {
                            data.sendAtHour = hour;
                        }
                        if (notification.minute != minute) {
                            data.sendAtMinute = minute;
                        }
                        if (notification.keyWord != values.keyWord) {
                            data.keyWord = values.keyWord;
                        }
                        if (notification.fromTime != values.fromTime) {
                            data.fromTime = values.fromTime;
                        }
                        if (notification.toTime != values.toTime) {
                            data.toTime = values.toTime;
                        }
                        if (JSON.stringify(notification.dayOfWeek) != JSON.stringify(values.dayOfWeek)) {
                            let dayOfWeek = '';
                            values.dayOfWeek.forEach((value: any) => dayOfWeek += `${value},`);
                            data.sendAtDayOfWeek = dayOfWeek.substring(0, dayOfWeek.length - 1);
                            if (notification.dayOfWeek.length == 0) {
                                data.sendAtDayOfMonth = '*';
                                data.sendAtMonths = '*';
                            }
                        }

                        data.tags = taggedMember;
                        Object.keys(data).forEach(key => data[key] === undefined ? delete data[key] : {});
                        try {
                            await updateNotification(data);
                            sendData(notification.id, 'update', notification.type);
                            message.success('Cập nhật thành công');
                        } catch (error) {
                            message.error('Cập nhật không thành công');
                        }
                         setIsLoading(false);
                    }}
                >
                    <h2>Nội dung</h2>
                    <Row>
                        <Col span={12}>
                            <ProFormText
                                name="name"
                                label="Tên thông báo"
                                width="md"
                                initialValue={notification.name}
                                rules={[{ required: true }]}
                                placeholder="Tên thông báo"
                            />
                            <ProFormText
                                name="keyWord"
                                label="Key word"
                                width="md"
                                tooltip="Hệ thống sẽ dựa vào keyword để check"
                                placeholder="Key word"
                                initialValue={notification.keyWord}
                                rules={[{ required: true }]}
                            />
                        </Col>
                        <Col span={12}>
                            <ProForm.Item
                                name="content"
                                label="Nội dung"

                            >
                                <Mentions
                                    style={{ width: '400', height: 100 }}
                                    loading={isLoading}
                                    rows={4}
                                    onChange={onChange}
                                    onSelect={onSelect}
                                    onSearch={onSearchMember}
                                    defaultValue={notification.content}
                                >
                                    {searchMembers.map(({ name, imageUrl: avatar, displayName }) => (
                                        <Option key={name} value={displayName} className="antd-demo-dynamic-option">
                                            <img className={styles.memberAvatar} src={avatar} />
                                            <span>{displayName}</span>
                                        </Option>
                                    ))}

                                </Mentions>
                            </ProForm.Item>
                        </Col>
                    </Row>

                    <h2>Thời gian</h2>
                    <Row>
                        <Col span={12}>
                            <ProFormTimePicker
                                name="time"
                                width="sm"
                                label="Thời gian gửi"
                                initialValue={moment(`${notification.hour}:${notification.minute}`, "hh:mm")}
                                rules={[{ required: true }]}
                            />
                            <ProFormTimePicker.RangePicker
                                name="scanTime"
                                label="Thời gian scan"
                                width="sm"
                                initialValue={[moment(`${notification.fromTime}`, "hh:mm"), moment(`${notification.toTime}`, "hh:mm")]}
                                fieldProps={{
                                    format: 'HH:mm',
                                }}
                                rules={[{ required: true }]}
                                tooltip="Thời gian hệ thống scan message"
                            />
                        </Col>
                        <Col span={12}>
                            <ProFormCheckbox.Group
                                name="dayOfWeek"
                                layout="vertical"
                                label="Ngày trong tuần"
                                width="lg"
                                initialValue={notification.dayOfWeek}
                                rules={[{ required: true }]}
                                options={[{ label: 'Thứ 2', value: 1 }, { label: 'Thứ 3', value: 2 },
                                { label: 'Thứ 4', value: 3 }, { label: 'Thứ 5', value: 4 },
                                { label: 'Thứ 6', value: 5 }, { label: 'Thứ 7', value: 6 },
                                { label: 'Chủ nhật', value: 0 }].map((item: any) => ({
                                    label: item.label,
                                    value: item.value,

                                }))}
                            />
                        </Col>
                    </Row>
                    <h2>Tùy chọn</h2>
                    <Row>
                        <Col span={12}>
                            <ProFormText
                                name="threadId"
                                label="ThreadID"
                                width="md"
                                placeholder="ThreadID"
                                initialValue={notification.threadId}
                            />
                        </Col>
                    </Row>
                </ProForm>

            </Card>
        </>
    )
}