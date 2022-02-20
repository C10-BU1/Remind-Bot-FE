import { Avatar, Divider, List, Skeleton, Button, Col, Row, Input } from 'antd';
import { useEffect, useState } from 'react';
import styles from './Member.less';
import ListMember from './ListMember';
import { AudioOutlined } from '@ant-design/icons';
import { memberInfoBySpaceIdAndRole, searchMemberInSpace } from '@/services/apis/memberApis';

export default function Member({ role, spaceId }: any) {
    const { Search } = Input;
    const [members, setMembers] = useState<API.MemberInfo>();
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState('');


    useEffect(() => {
        const listAdmin = async () => {

        }
        const listMember = async () => {
            const res = await memberInfoBySpaceIdAndRole(spaceId, role, currentPage);
            setMembers(res.data.data);
            setTotal(res.data.total)
        }

        const searchMember = async () => {
            const res = await searchMemberInSpace(spaceId, role, currentPage, search);
            setMembers(res.data.data);
            setTotal(res.data.total);
        }

        if (role == 'admin') {
            listAdmin();
        } else if (role == 'member') {
            if (search == '') {
                listMember();
            }else{
                searchMember();
            }
        }

    }, [currentPage]);
    const onSearch = async (value: string, e: any) => {
        const res = await searchMemberInSpace(spaceId, role, currentPage, value);
        setMembers(res.data.data);
        setTotal(res.data.total);
        setSearch(value);
    };

    const suffix = (
        <AudioOutlined
            style={{
                fontSize: 16,
                color: '#1890ff',
            }}
        />
    );

    return (
        <>
            {
                role == 'admin' &&
                <div>

                </div>
            }
            {
                role == 'member' &&
                <div>
                    <Row>
                        <Col span={6} offset={6}>
                            <h2>Danh sách member</h2>
                        </Col>
                        <Col span={6} offset={6}>
                            <Search placeholder="Tìm kiếm thành viên" onSearch={onSearch} enterButton />
                        </Col>
                    </Row>
                    <List pagination={{
                        onChange: page => {
                            setCurrentPage(page);
                        },
                        pageSize: 7,
                        total: total,
                        position: 'top'
                    }}
                        dataSource={members}
                        renderItem={member => (
                            <ListMember member={member} spaceId={spaceId} />
                        )}
                    >
                    </List>
                </div>

            }

        </>
    )
}