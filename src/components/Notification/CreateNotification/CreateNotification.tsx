import ProForm, {
    StepsForm,
    ProFormText,
    ProFormDatePicker,
    ProFormTextArea,
    ProFormCheckbox,
    ProFormInstance,
    ProFormTimePicker,
} from '@ant-design/pro-form';
import { Button, Card, Radio, Spin, Result, Mentions, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import styles from './CreateNotification.less';
import moment from 'moment';
import { listMember } from '@/services/apis/memberApis';
import { createNormalNotification, createReminderNotification } from '@/services/apis/notificationApis';
import { searchMemberByDisplayName } from '@/services/apis/memberApis';

const { Option } = Mentions;
export default function CreateNotification({ notificationCate, spaceId, sendData }: any) {
    const [blockDisplay, setBlockDisplay] = useState(notificationCate);
    const [value, setValue] = useState(1);
    const [dayOfWeekCate, setDayOfWeekCate] = useState("block");
    const [dayOfMonthCate, setDayOfMonthCate] = useState("none");
    const [members, setMembers] = useState([{ displayName: 'Tất cả', name: 'Tất cả' }]);
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef<ProFormInstance>();
    const [searchMembers, setSearchMember] = useState([]);
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<any>([]);
    useEffect(() => {
        setBlockDisplay(notificationCate);
    }, [notificationCate]);
    useEffect(() => {
        const getListMember = async () => {
            const res = await listMember(spaceId);
            setMembers([...members, ...res.data.members])
        }
        getListMember();
    }, [spaceId]);

    const onChangeCategory = (e: any) => {
        setValue(e.target.value);
        if (e.target.value == 1) {
            setDayOfWeekCate("block");
            setDayOfMonthCate("none");
        } else {
            setDayOfWeekCate("none");
            setDayOfMonthCate("block");
        }
    };
    const onChange = (value: any) => {
        setContent(value);
    }

    const onSelect = (option: any) => {
        setTags([...tags, { name: option.key, displayName: option.value }]);
    }

    const onSearchMember = async (search: string) => {
        setIsLoading(true)
        const res = await searchMemberByDisplayName(spaceId, search);
        setSearchMember(res.data);
        setIsLoading(false);
    }
    return (
        <>
            {blockDisplay == 1 &&
                <Card className={styles.cardStep}>
                    <h2>Thông báo bình thường</h2>
                    <StepsForm<{
                        name: string;
                    }>
                        formRef={formRef}
                        onFinish={async (values: any) => {
                            let dayOfWeek = [];
                            if (dayOfWeekCate == "block") {
                                dayOfWeek = values.dayOfWeek;
                            }
                            const data = {
                                name: values.name,
                                content: content,
                                tags: tags,
                                dayOfWeek: dayOfWeek,
                                minute: minute,
                                hour: hour,
                                dayOfMonth: day,
                                month: month,
                                year: year,
                                threadId: values.threadId,
                                spaceId: spaceId
                            }
                            setIsLoading(true);
                            try {
                                await createNormalNotification(data);
                                setIsLoading(false);
                                setBlockDisplay(3);
                                sendData(0, 'create', null);
                            } catch (error) {
                                message.error('Yêu cầu tạo thông báo không thành công')
                            }
                        }}
                        formProps={{
                            validateMessages: {
                                required: 'Không được bỏ trống',
                            },
                        }}
                        submitter={{
                            render: (props) => {
                                if (props.step === 0) {
                                    return (
                                        <Button className={styles.formBtn} type="primary" onClick={() => props.onSubmit?.()}>
                                            Tiếp theo {'>'}
                                        </Button>
                                    );
                                }

                                if (props.step === 1) {
                                    return [
                                        <Button className={styles.formBtn} key="pre" onClick={() => props.onPre?.()}>
                                            Quay lại
                                        </Button>,
                                        <Button className={styles.formBtn} type="primary" key="goToTree" onClick={() => props.onSubmit?.()}>
                                            Tiếp thep {'>'}
                                        </Button>,
                                    ];
                                }

                                return [
                                    <Button className={styles.formBtn} key="gotoTwo" onClick={() => props.onPre?.()}>
                                        {'<'} Quay lai
                                    </Button>,
                                    <>
                                        {
                                            !isLoading &&
                                            <Button className={styles.formBtn} type="primary" key="goToTree" onClick={() => props.onSubmit?.()}>
                                                Hoàn thành √
                                            </Button>
                                        }
                                    </>,
                                    <>
                                        {
                                            isLoading &&
                                            <Spin tip="loading">
                                                <Button className={styles.formBtn} type="primary" disabled key="goToTree" onClick={() => props.onSubmit?.()}>
                                                    Hoàn thành √
                                                </Button>
                                            </Spin>

                                        }
                                    </>
                                ];
                            },
                        }}
                    >
                        <StepsForm.StepForm<{
                            name: string;
                        }>
                            name="base"
                            title="Nội dung"
                            onFinish={async ({ name }) => {
                                return true;
                            }}
                        >
                            <ProFormText
                                name="name"
                                label="Tên thông báo"
                                width="md"
                                tooltip="VD: Check daily report"
                                placeholder="Tên thông báo"
                                rules={[{ required: true }]}
                            />
                            <ProFormTextArea
                                name="content"
                                label="Nội dung"
                                width="md"
                                colSize={4}
                                placeholder="Nội dung của thông báo"
                            >
                                <Mentions
                                    style={{ width: '100%', height: 100 }}
                                    loading={isLoading}
                                    onChange={onChange}
                                    onSelect={onSelect}
                                    onSearch={onSearchMember}

                                >
                                    <Option key='all' value='all' >all</Option>
                                    {searchMembers.map(({ name, imageUrl: avatar, displayName }) => (
                                        <Option key={name} value={displayName} className="antd-demo-dynamic-option">
                                            {avatar != null ? <img className={styles.memberAvatar} src={avatar} />: <img className={styles.memberAvatar} src="https://employer.jobsgo.vn/uploads/media/img/202012/pictures_library_54325_20201229102148_9091.jpg" />}
                                            <span>{displayName}</span>
                                        </Option>
                                    ))}

                                </Mentions>
                            </ProFormTextArea>

                        </StepsForm.StepForm>
                        <StepsForm.StepForm<{
                            checkbox: string;
                        }>
                            name="checkbox"
                            title="Thời gian"
                            onFinish={async () => {
                                const value = formRef.current?.getFieldsValue();
                                setHour(moment(value.time).format('k'));
                                setMinute(moment(value.time).format('m'));
                                if (dayOfMonthCate == "block") {
                                    setDay(moment(value.dayOfMonth).format('D'));
                                    setMonth(moment(value.dayOfMonth).format('M'));
                                    setYear(moment(value.dayOfMonth).format('YYYY'));

                                }
                                return true;
                            }}
                        >
                            <ProFormTimePicker
                                name="time"
                                label="Thời gian gửi"
                                width="sm"
                                rules={[{ required: true }]}
                                tooltip="Thời gian mà thông báo được gửi"
                            />
                            <Radio.Group
                                defaultValue="a"
                                buttonStyle="solid"
                                onChange={onChangeCategory}
                                value={value}
                            >
                                <Radio.Button value={1}>Theo ngày trong tuần</Radio.Button>
                                <Radio.Button value={2}>Theo ngày trong tháng</Radio.Button>

                            </Radio.Group>
                            <ProForm.Group
                                style={{ display: dayOfWeekCate }}
                            >
                                <ProFormCheckbox.Group
                                    name="dayOfWeek"
                                    label="Ngày trong tuần"
                                    width="lg"
                                    layout="vertical"
                                    rules={[{ required: true }]}
                                    tooltip="Các ngày trong tuần mà thông báo được gửi"
                                    initialValue={[{ label: 'Thứ 2', value: 1 }]}
                                    options={[{ label: 'Thứ 2', value: 1 }, { label: 'Thứ 3', value: 2 }, { label: 'Thứ 4', value: 3 }, { label: 'Thứ 5', value: 4 }, { label: 'Thứ 6', value: 5 }, { label: 'Thứ 7', value: 6 }, { label: 'Chủ nhật', value: 0 }].map((item: any) => ({
                                        label: item.label,
                                        value: item.value,

                                    }))}
                                />
                            </ProForm.Group>
                            <ProForm.Group
                                style={{ display: dayOfMonthCate }}
                            >
                                <ProFormDatePicker
                                    name="dayOfMonth"
                                    fieldProps={{
                                        format: 'DD-MM-YYYY',
                                    }}
                                    label="Ngày trong tháng"
                                    initialValue={{ dateMonth: Date.now() }}
                                    rules={[{ required: true }]}
                                />
                            </ProForm.Group>
                        </StepsForm.StepForm>
                        <StepsForm.StepForm
                            name="time"
                            title="Tùy chọn"
                            onFinish={async () => {
                                const value = formRef.current?.getFieldsValue();


                                return true;
                            }}
                        >
                            <ProFormText
                                name="threadId"
                                label="Thread ID"
                                width="md"
                                tooltip={`Thread bạn muốn bot gửi thông báo. Vào space và gõ thread để nhận được threadID.\n
                                Nếu nhập sai threadID thì thông báo sẽ tự động bị vô hiệu hóa`}
                                placeholder=""
                            />
                        </StepsForm.StepForm>
                    </StepsForm>
                </Card>
            }
            {blockDisplay == 2 &&
                <Card className={styles.cardStep}>
                    <h2>Thông báo nhắc nhở</h2>
                    <StepsForm<{
                        name: string;
                    }>
                        formRef={formRef}
                        onFinish={async (values: any) => {
                            
                            const data = {
                                name: values.name,
                                content: content,
                                tags: tags,
                                dayOfWeek: values.dayOfWeek,
                                keyWord: values.keyWord,
                                fromTime: values.scanTime[0],
                                toTime: values.scanTime[1],
                                minute: minute,
                                hour: hour,
                                threadId: values.threadId,
                                spaceId: spaceId
                            }
                            setIsLoading(true);
                            try {
                                await createReminderNotification(data);
                                setIsLoading(false);
                                setBlockDisplay(3);
                                sendData(0, 'create', null);
                            } catch (error: any) {
                                if (error.response.status == 409) {
                                    message.error('ThreadId này đã được sử dụng cho một thông báo nhắc nhở khác!!')
                                }
                                setIsLoading(false);
                            }

                        }}
                        formProps={{
                            validateMessages: {
                                required: 'Không được bỏ trống',
                            },
                        }}
                        submitter={{
                            render: (props) => {
                                if (props.step === 0) {
                                    return (
                                        <Button type="primary" onClick={() => props.onSubmit?.()}>
                                            Tiếp theo {'>'}
                                        </Button>
                                    );
                                }

                                if (props.step === 1) {
                                    return [
                                        <Button key="pre" onClick={() => props.onPre?.()}>
                                            Quay lại
                                        </Button>,
                                        <Button type="primary" key="goToTree" onClick={() => props.onSubmit?.()}>
                                            Tiếp thep {'>'}
                                        </Button>,
                                    ];
                                }

                                return [
                                    <Button key="gotoTwo" onClick={() => props.onPre?.()}>
                                        {'<'} Quay lai
                                    </Button>,
                                    <>
                                        {
                                            !isLoading &&
                                            <Button type="primary" key="goToTree" onClick={() => props.onSubmit?.()}>
                                                Hoàn thành √
                                            </Button>
                                        }
                                    </>,
                                    <>
                                        {
                                            isLoading &&
                                            <Spin tip="loading">
                                                <Button type="primary" disabled key="goToTree" onClick={() => props.onSubmit?.()}>
                                                    Hoàn thành √
                                                </Button>
                                            </Spin>

                                        }
                                    </>
                                ];
                            },
                        }}
                    >
                        <StepsForm.StepForm<{
                            name: string;
                        }>
                            name="base"
                            title="Nội dung"
                            onFinish={async ({ name }) => {
                                return true;
                            }}
                        >
                            <ProFormText
                                name="name"
                                label="Tên thông báo"
                                width="md"
                                tooltip="VD: Check daily report"
                                placeholder="Tên thông báo"
                                rules={[{ required: true }]}
                            />
                            <ProFormText
                                name="keyWord"
                                label="Key word"
                                width="md"
                                tooltip="Hệ thống sẽ dựa vào keyword để check"
                                placeholder="Key word"
                                rules={[{ required: true }]}
                            />
                            <ProFormTextArea
                                name="content"
                                label="Nội dung"
                                width="md"
                                colSize={4}
                                placeholder="Nội dung của thông báo"
                            >
                                <Mentions
                                    style={{ width: '100%', height: 100 }}
                                    loading={isLoading}
                                    onChange={onChange}
                                    onSelect={onSelect}
                                    onSearch={onSearchMember}
                                >
                                    {searchMembers.map(({ name, imageUrl: avatar, displayName }) => (
                                        <Option key={name} value={displayName} className="antd-demo-dynamic-option">
                                            <img className={styles.memberAvatar} src={avatar} />
                                            <span>{displayName}</span>
                                        </Option>
                                    ))}

                                </Mentions>
                            </ProFormTextArea>

                        </StepsForm.StepForm>
                        <StepsForm.StepForm<{
                            checkbox: string;
                        }>
                            name="checkbox"
                            title="Thời gian"
                            onFinish={async () => {
                                const value = formRef.current?.getFieldsValue();
                                setHour(moment(value.time).format('k'));
                                setMinute(moment(value.time).format('m'));
                                return true;
                            }}
                        >
                            <ProForm.Group>
                                <ProFormTimePicker
                                    name="time"
                                    label="Thời gian gửi"
                                    width="sm"
                                    fieldProps={{
                                        format: 'HH:mm',
                                    }}
                                    rules={[{ required: true }]}
                                    tooltip="Thời gian mà thông báo được gửi"
                                />
                                <ProFormTimePicker.RangePicker
                                    name="scanTime"
                                    label="Thời gian scan"
                                    width="sm"
                                    fieldProps={{
                                        format: 'HH:mm',
                                    }}
                                    rules={[{ required: true }]}
                                    tooltip="Thời gian hệ thống scan message"
                                />
                            </ProForm.Group>

                            <ProForm.Group>
                                <ProFormCheckbox.Group
                                    name="dayOfWeek"
                                    label="Ngày trong tuần"
                                    width="lg"
                                    layout="vertical"
                                    rules={[{ required: true }]}
                                    tooltip="Các ngày trong tuần mà thông báo được gửi"
                                    initialValue={[{ label: 'Thứ 2', value: 1 }]}
                                    options={[{ label: 'Thứ 2', value: 1 }, { label: 'Thứ 3', value: 2 }, { label: 'Thứ 4', value: 3 }, { label: 'Thứ 5', value: 4 }, { label: 'Thứ 6', value: 5 }, { label: 'Thứ 7', value: 6 }, { label: 'Chủ nhật', value: 0 }].map((item: any) => ({
                                        label: item.label,
                                        value: item.value,

                                    }))}
                                />
                            </ProForm.Group>

                        </StepsForm.StepForm>
                        <StepsForm.StepForm
                            name="time"
                            title="Tùy chọn"
                            onFinish={async () => {
                                return true;
                            }}
                        >
                            <ProFormText
                                name="threadId"
                                label="Thread ID"
                                width="md"
                                rules={[{ required: true }]}
                                tooltip={`Thread bạn muốn bot gửi thông báo. Vào space và gõ thread để nhận được threadID.\n
                           Nếu nhập sai threadID thì thông báo sẽ tự động bị vô hiệu hóa. Lưu ý: một thread chỉ có thể áp dụng duy nhất một thông báo nhắc nhở`}
                                placeholder=""
                            />
                        </StepsForm.StepForm>
                    </StepsForm>
                </Card>
                // <div>
                //     <Result
                //         title="Tính năng này đang được phát triển"
                //     />
                // </div>
            }
            {
                blockDisplay == 3 &&
                <div>
                    <Result
                        status="success"
                        title="Thông báo được tạo thành công"
                    />,
                </div>
            }
        </>
    )
}