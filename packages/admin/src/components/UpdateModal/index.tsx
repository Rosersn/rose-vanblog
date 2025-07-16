import { createCategory, getAllCategories, getTags, updateArticle, updateDraft } from '@/services/van-blog/api';
import { ModalForm, ProFormDateTimePicker, ProFormItem, ProFormSelect, ProFormText } from '@ant-design/pro-form';
import { AutoComplete, Form, message, Modal } from 'antd';
import * as moment from 'moment';
import { useEffect, useState } from 'react';
import AuthorField from '../AuthorField';

export default function (props: {
  currObj: any;
  setLoading: any;
  onFinish: any;
  type: 'article' | 'draft' | 'about';
}) {
  const { currObj, setLoading, type, onFinish } = props;
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (form && form.setFieldsValue) form.setFieldsValue(currObj);
  }, [currObj]);

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
      form={form}
      title="修改信息"
      trigger={
        <a key="button" type="link">
          修改信息
        </a>
      }
      width={450}
      autoFocusFirstInput
      submitTimeout={3000}
      initialValues={currObj || {}}
      onFinish={async (values) => {
        if (location.hostname == 'blog-demo.mereith.com' && type != 'draft') {
          Modal.info({
            title: '演示站禁止修改信息！',
            content: '本来是可以的，但有个人在演示站首页放黄色信息，所以关了这个权限了。',
          });
          return;
        }
        if (!currObj || !currObj.id) {
          return false;
        }
        setLoading(true);
        
        // 检查是否需要创建新分类
        if (values.category) {
          try {
            const { data: categories } = await getAllCategories();
            if (!categories.includes(values.category)) {
              // 创建新分类
              await createCategory({ name: values.category });
              message.success(`新分类 "${values.category}" 创建成功！`);
            }
          } catch (error) {
            if (error.response?.status === 406) {
              message.error(error.response?.data?.message || '分类创建失败');
              setLoading(false);
              return false;
            }
            // 如果是其他错误，继续更新
            console.warn('检查分类时出错:', error);
          }
        }
        
        if (type == 'article') {
          await updateArticle(currObj?.id, values);
          onFinish();
          message.success('修改文章成功！');
          setLoading(false);
        } else if (type == 'draft') {
          await updateDraft(currObj?.id, values);
          onFinish();
          message.success('修改草稿成功！');
          setLoading(false);
        } else {
          return false;
        }

        return true;
      }}
      layout="horizontal"
      labelCol={{ span: 6 }}
      key="editForm"
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
      <AuthorField />
      <ProFormSelect
        mode="tags"
        width="md"
        name="tags"
        label="标签"
        placeholder="请选择或输入标签"
        fieldProps={{
          tokenSeparators: [','],
        }}
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
        width="md"
        name="createdAt"
        id="createdAt"
        label="创建时间"
        placeholder="不填默认为此刻"
        showTime={{
          defaultValue: moment('00:00:00', 'HH:mm:ss'),
        }}
      />
      {type == 'article' && (
        <>
          <ProFormText
            width="md"
            id="top"
            name="top"
            label="置顶优先级"
            placeholder="留空或0表示不置顶，其余数字越大表示优先级越高"
          />
          <ProFormText
            width="md"
            id="pathname"
            name="pathname"
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
            width="md"
            name="private"
            id="private"
            label="是否加密"
            placeholder="是否加密"
            request={async () => {
              return [
                {
                  label: '否',
                  value: 'false',
                },
                {
                  label: '是',
                  value: 'true',
                },
              ];
            }}
          />
          <ProFormText.Password
            label="密码"
            width="md"
            id="password"
            name="password"
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
                  value: 'false',
                },
                {
                  label: '是',
                  value: 'true',
                },
              ];
            }}
          />
          <ProFormText
            width="md"
            id="copyright"
            name="copyright"
            label="版权声明"
            tooltip="设置后会替换掉文章页底部默认的版权声明文字，留空则根据系统设置中的相关选项进行展示"
            placeholder="设置后会替换掉文章底部默认的版权"
          />
        </>
      )}
    </ModalForm>
  );
}
