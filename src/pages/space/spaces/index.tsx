import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Alert, Typography, Button, Radio } from 'antd';
import { useIntl, FormattedMessage } from 'umi';
import styles from './Spaces.less';
import { Table, Tag, Space, Input } from 'antd';
import { getSpace, searchByName } from '@/services/apis/spaceApis';
const CodePreview: React.FC = ({ children }) => (
  <pre className={styles.pre}>
    <code>
      <Typography.Text copyable>{children}</Typography.Text>
    </code>
  </pre>
);

const Spaces: React.FC = () => {
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
      render: (text: string) => <a href={`spaces/${text}`}><Button type="primary">Chi tiết</Button></a>
    },

  ];
  const paginate = {
    pageSize: 10,
    total: totalItems,
    onchange
  }

  useEffect(() => {
    const callApiNoneSearch = async () => {
      const res = await getSpace(currentPage);
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
    }else{
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
    <PageContainer>
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
};

export default Spaces;
