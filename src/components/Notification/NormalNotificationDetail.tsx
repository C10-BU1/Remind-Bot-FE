import ProForm, { ProFormText, ProFormTimePicker, ProFormCheckbox, ProFormDatePicker } from "@ant-design/pro-form";
import { FooterToolbar } from "@ant-design/pro-layout";
import { Button, Card, Col, Form, message, Radio, Row, Spin } from "antd";
import { useEffect, useState } from "react";
import { Mentions } from 'antd';
import moment from 'moment';
import styles from './Notification.less';
import { searchMemberByDisplayName } from '@/services/apis/memberApis';
import { UpdateNotification } from "./dto/update-notification.dto";
import { updateNotification } from "@/services/apis/notificationApis";
const { Option } = Mentions;

export default function NormalNotificationDetail({ notification, spaceId, sendData }: any) {
    // const [notification, setNotification] = useState<API.NormalNotification>();
    const [taggedMember, setTaggedMember] = useState<any>([]);
    const [radioValue, setRadioValue] = useState(1);
    const [rerender, setRerender] = useState(false);
    //  const formRef =useRef<ProFormInstance<{name: string}>>();
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

    const onChangeCategory = (e: any) => {
        setRadioValue(e.target.value);
    }


    useEffect(() => {
        setTaggedMember(notification.tags);
        if (notification.dayOfMonth != '') {
            setRadioValue(2);
        } else {
            setRadioValue(1);
        }
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
                        if (radioValue == 1 && JSON.stringify(notification.dayOfWeek) != JSON.stringify(values.dayOfWeek)) {
                            let dayOfWeek = '';
                            values.dayOfWeek.forEach((value: any) => dayOfWeek += `${value},`);
                            data.sendAtDayOfWeek = dayOfWeek.substring(0, dayOfWeek.length - 1);
                            if (notification.dayOfWeek.length == 0) {
                                data.sendAtDayOfMonth = '*';
                                data.sendAtMonths = '*';
                            }
                        }
                        if (radioValue == 2) {
                            const fieldDayOfMonth = moment(values.dayOfMonth, 'DD-MM-YYYY');
                            const dayOfMonth = moment(fieldDayOfMonth).format('D');
                            const month = moment(fieldDayOfMonth).format('M');
                            const year = moment(fieldDayOfMonth).format('YYYY');
                            if (dayOfMonth != notification.dayOfMonth || month != notification.month || year != notification.year) {
                                const d = new Date();
                                const currentYear = d.getFullYear();
                                const currentMonth = d.getMonth();
                                data.sendAtDayOfMonth = dayOfMonth;
                                data.sendAtMonths = ((parseInt(year) - currentYear) * 12 - currentMonth + parseInt(month)).toString();
                                data.createdAt = new Date();
                                if (notification.dayOfMonth == '') {
                                    data.sendAtDayOfWeek = '*';
                                }
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
                            {notification.type == 'reminder' &&
                                <ProFormText
                                    name="keyWord"
                                    label="Key word"
                                    width="md"
                                    tooltip="Hệ thống sẽ dựa vào keyword để check"
                                    placeholder="Key word"
                                    rules={[{ required: true }]}
                                />
                            }
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
                                    <Option key='all' value='all' >all</Option>
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
                        </Col>
                        <Col span={12}>
                            <Radio.Group
                                defaultValue="a"
                                buttonStyle="solid"
                                onChange={onChangeCategory}
                                value={radioValue}
                                className={styles.radioGroup}
                            >
                                <Radio.Button value={1}>Theo ngày trong tuần</Radio.Button>
                                <Radio.Button value={2}>Theo ngày trong tháng</Radio.Button>

                            </Radio.Group>

                            {
                                radioValue == 1 &&
                                <ProFormCheckbox.Group
                                    name="dayOfWeek"
                                    layout="vertical"
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
                            }
                            {
                                radioValue == 2 &&
                                <ProFormDatePicker

                                    name="dayOfMonth"
                                    fieldProps={{
                                        format: 'DD-MM-YYYY',
                                    }}
                                    rules={[{ required: true }]}
                                    initialValue={
                                        moment(notification.dayOfMonth == '' ? new Date() : `${notification.dayOfMonth}-${notification.month}-${notification.year}`, "DD-MM-YYYY")
                                    }
                                />
                            }
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