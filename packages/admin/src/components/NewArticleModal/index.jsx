import { createArticle, createCategory, getAllCategories, getTags } from '@/services/van-blog/api';
import {
    ModalForm,
    ProFormDateTimePicker,
    ProFormItem,
    ProFormSelect,
    ProFormText,
} from '@ant-design/pro-components';
import { AutoComplete, Button, Modal, message } from 'antd';
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
      title="新建文章"
      trigger={
        <Button key="button" type="primary">
          新建文章
        </Button>
      }
      width={450}
      autoFocusFirstInput
      submitTimeout={3000}
      onFinish={async (values) => {
        if (location.hostname == 'blog-demo.mereith.com') {
          Modal.info({
            title: '演示站禁止新建文章！',
            content: '本来是可以的，但有个人在演示站首页放黄色信息，所以关了这个权限了。',
          });
          return;
        }
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

        const { data } = await createArticle(washedValues);
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
      <ProFormText
        width="md"
        id="topC"
        name="topC"
        label="置顶优先级"
        placeholder="留空或0表示不置顶，其余数字越大表示优先级越高"
      />
      <ProFormText
        width="md"
        id="pathnameC"
        name="pathnameC"
        label="自定义路径名"
        tooltip="文章发布后的路径将为 /post/[自定义路径名]，如果未设置则使用文章 id 作为路径名"
        placeholder="留空或为空则使用 id 作为路径名"
        rules={[
          {
            validator: async (_, value) => {
              if (!value) {
                return Promise.resolve();
              }
              // 检查是否为纯数字
              if (/^\d+$/.test(value.trim())) {
                return Promise.reject(new Error('自定义路径名不能为纯数字，避免与文章ID冲突'));
              }
              return Promise.resolve();
            },
          },
        ]}
      />
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
        placeholder="不填默认为此刻"
        name="createdAtC"
        id="createdAtC"
        label="创建时间"
        width="md"
        showTime={{
          defaultValue: moment('00:00:00', 'HH:mm:ss'),
        }}
      />

      <ProFormSelect
        width="md"
        name="privateC"
        id="privateC"
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
        id="passwordC"
        name="passwordC"
        autocomplete="new-password"
        placeholder="请输入密码"
        dependencies={['private']}
      />
      <ProFormSelect
        width="md"
        name="hiddenC"
        id="hiddenC"
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
      <ProFormText
        width="md"
        id="copyrightC"
        name="copyrightC"
        label="版权声明"
        tooltip="设置后会替换掉文章页底部默认的版权声明文字，留空则根据系统设置中的相关选项进行展示"
        placeholder="设置后会替换掉文章底部默认的版权"
      />
    </ModalForm>
  );
}
