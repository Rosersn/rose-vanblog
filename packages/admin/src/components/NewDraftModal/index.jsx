import { createCategory, createDraft, getAllCategories, getTags } from '@/services/van-blog/api';
import {
    ModalForm,
    ProFormDateTimePicker,
    ProFormItem,
    ProFormSelect,
    ProFormText,
} from '@ant-design/pro-components';
import { AutoComplete, Button, message } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import AuthorField from '../AuthorField';

export default function (props) {
  const { onFinish } = props;
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // 获取分类列表
    const fetchCategories = async () => {
      try {
        const { data } = await getAllCategories();
        setCategories(data || []);
      } catch (error) {
        console.warn('获取分类列表失败:', error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <ModalForm
      title="新建草稿"
      trigger={
        <Button key="button" type="primary">
          新建草稿
        </Button>
      }
      width={450}
      autoFocusFirstInput
      submitTimeout={3000}
      onFinish={async (values) => {
        const washedValues = {};
        for (const [k, v] of Object.entries(values)) {
          washedValues[k.replace('C', '')] = v;
        }

        // 检查是否需要创建新分类
        if (washedValues.category) {
          try {
            const { data: categories } = await getAllCategories();
            if (!categories.includes(washedValues.category)) {
              // 创建新分类
              await createCategory({ name: washedValues.category });
              message.success(`新分类 "${washedValues.category}" 创建成功！`);
            }
          } catch (error) {
            if (error.response?.status === 406) {
              message.error(error.response?.data?.message || '分类创建失败');
              return false;
            }
            // 如果是其他错误，继续创建草稿
            console.warn('检查分类时出错:', error);
          }
        }

        const { data } = await createDraft(washedValues);
        if (onFinish) {
          onFinish(data);
        }
        return true;
      }}
      layout="horizontal"
      labelCol={{ span: 6 }}
      // wrapperCol: { span: 14 },
    >
      <ProFormText
        width="md"
        required
        id="titleC"
        name="titleC"
        label="文章标题"
        placeholder="请输入标题"
        rules={[{ required: true, message: '这是必填项' }]}
      />
      <AuthorField />
      <ProFormSelect
        mode="tags"
        tokenSeparators={[',']}
        width="md"
        name="tagsC"
        label="标签"
        placeholder="请选择或输入标签"
        request={async () => {
          const msg = await getTags();
          return msg?.data?.map((item) => ({ label: item, value: item })) || [];
        }}
      />
      <ProFormItem
        width="md"
        required
        label="分类"
        name="categoryC"
        tooltip="可以选择已有分类，也可以输入新分类名称"
        rules={[{ required: true, message: '这是必填项' }]}
      >
        <AutoComplete
          placeholder="请选择分类或输入新分类名称"
          allowClear
          filterOption={(inputValue, option) =>
            option?.value?.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
          }
          options={categories.map(item => ({ value: item, label: item }))}
          style={{ width: '100%' }}
        />
      </ProFormItem>
      <ProFormDateTimePicker
        width="md"
        name="createdAtC"
        id="createdAtC"
        label="创建时间"
        placeholder="不填默认为此刻"
        showTime={{
          defaultValue: moment('00:00:00', 'HH:mm:ss'),
        }}
      />
    </ModalForm>
  );
}
