import { PageContainer } from '@ant-design/pro-layout';
import { Button, Card, Input, Table } from 'antd';
import { useEffect, useState } from 'react';
import { getSpaces, searchByName } from '@/services/apis/spaceApis';
import { useHistory } from 'react-router';



export default function MySpace() {
    const routerHistory = useHistory();
    const { Search } = Input;
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState('');
    const columns = [
        {
            title: 'Tên space',
            dataIndex: 'displayName',
            key: 'id',

            render: (text: string) => <a>{text}</a>,
        },
        {
            title: 'Tổng thành viên',
            dataIndex: 'totalMember',
            key: 'totalMember',

        },
        {
            title: '',
            dataIndex: 'id',
            key: 'id',
            render: (text: string) => <Button onClick={e => handleChooseSpace(e, text)} type="primary">Chi tiết</Button>
        },

    ];
    const handleChooseSpace = (e: any, spaceId: string) => {
        console.log(spaceId)
        routerHistory.push(`/space/${spaceId}/detail`);
    }
    const paginate = {
        pageSize: 10,
        total: totalItems,
        onchange
    }

    useEffect(() => {
        const callApiNoneSearch = async () => {
            const res = await getSpaces(currentPage);
            setTotalItems(res.data.total);
            setData(res.data.data);
        }
        const callApiSearch = async () => {
            const res = await searchByName(search, currentPage);
            setData(res.data.data);
            setTotalItems(res.data.total);
        }
        if (search == '') {
            callApiNoneSearch();
        } else {
            callApiSearch();
        }
    }, [currentPage])

    const changePage = (pagination: any) => {
        setCurrentPage(pagination.current);
    }
    const onSearch = async (value: string, e: any) => {
        const res = await searchByName(value, currentPage);
        setData(res.data.data);
        setTotalItems(res.data.total);
        setSearch(value);
    }
    return (
        <PageContainer
        header={{
            title: `Space của tôi`,
        }}
        >
            <Card>
                <Search
                    placeholder="Tìm kiếm space"
                    allowClear
                    enterButton="Tìm kiếm"
                    size="small"
                    onSearch={onSearch}
                    style={{ width: 304, marginBottom: 10 }}
                    className='space-search-input'
                />
                <Table columns={columns} dataSource={data} pagination={paginate} onChange={changePage} />
            </Card>
        </PageContainer>
    );
    
}