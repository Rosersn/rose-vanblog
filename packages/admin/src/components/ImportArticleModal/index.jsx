import { createArticle, createCategory, getAllCategories, getTags } from '@/services/van-blog/api';
import { parseMarkdownFile } from '@/services/van-blog/parseMarkdownFile';
import {
    ModalForm,
    ProFormDateTimePicker,
    ProFormItem,
    ProFormSelect,
    ProFormText,
    ProFormTextArea,
} from '@ant-design/pro-components';
import { AutoComplete, Button, Form, Upload, message } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';

export default function (props) {
  const { onFinish } = props;
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
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

  const handleUpload = async (file) => {
    const vals = await parseMarkdownFile(file);
    if (vals) {
      // 检查是否需要创建新分类
      if (vals.category) {
        try {
          const { data: categories } = await getAllCategories();
          if (!categories.includes(vals.category)) {
            // 创建新分类
            await createCategory({ name: vals.category });
            message.success(`新分类 "${vals.category}" 创建成功！`);
          }
        } catch (error) {
          if (error.response?.status === 406) {
            message.error(error.response?.data?.message || '分类创建失败');
            return;
          }
          // 如果是其他错误，继续创建文章
          console.warn('检查分类时出错:', error);
        }
      }
      await createArticle(vals);
    }
  };

  const beforeUpload = async (file, files) => {
    if (files.length > 1) {
      await handleUpload(file);
      if (files[files.length - 1] == file) {
        if (onFinish) {
          onFinish();
        }
      }
    } else {
      const vals = await parseMarkdownFile(file);
      form.setFieldsValue(vals);
      setVisible(true);
    }
  };

  return (
    <>
      <Upload showUploadList={false} multiple={true} accept={'.md'} beforeUpload={beforeUpload}>
        <Button key="button" type="primary" title="从 markdown 文件导入，可多选">
          导入
        </Button>
      </Upload>
      <ModalForm
        form={form}
        title="导入文章"
        visible={visible}
        onVisibleChange={(v) => {
          setVisible(v);
        }}
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
              // 如果是其他错误，继续创建文章
              console.warn('检查分类时出错:', error);
            }
          }

          await createArticle(washedValues);
          if (onFinish) {
            onFinish();
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
          id="title"
          name="title"
          label="文章标题"
          placeholder="请输入标题"
          rules={[{ required: true, message: '这是必填项' }]}
        />
        <ProFormText
          width="md"
          id="top"
          name="top"
          label="置顶优先级"
          placeholder="留空或0表示不置顶，其余数字越大表示优先级越高"
        />
        <ProFormSelect
          mode="tags"
          tokenSeparators={[',']}
          width="md"
          name="tags"
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
          name="category"
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
          showTime={{
            defaultValue: moment('00:00:00', 'HH:mm:ss'),
          }}
          width="md"
          name="createdAt"
          id="createdAt"
          label="创建时间"
        />
        <ProFormSelect
          width="md"
          name="private"
          id="private"
          label="是否加密"
          placeholder="是否加密"
          request={async () => {
            return [
              {
                label: '否',
                value: false,
              },
              {
                label: '是',
                value: true,
              },
            ];
          }}
        />
        <ProFormText.Password
          label="密码"
          width="md"
          id="password"
          name="password"
          autocomplete="new-password"
          placeholder="请输入密码"
          dependencies={['private']}
        />
        <ProFormSelect
          width="md"
          name="hidden"
          id="hidden"
          label="是否隐藏"
          placeholder="是否隐藏"
          request={async () => {
            return [
              {
                label: '否',
                value: false,
              },
              {
                label: '是',
                value: true,
              },
            ];
          }}
        />
        <ProFormTextArea
          name="content"
          label="内容"
          id="content"
          fieldProps={{ autoSize: { minRows: 3, maxRows: 5 } }}
        />
      </ModalForm>
    </>
  );
}
