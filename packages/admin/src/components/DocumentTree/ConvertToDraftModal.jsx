import { convertDocumentToDraft, createCategory, getAllCategories } from '@/services/van-blog/api';
import { AutoComplete, Form, message, Modal } from 'antd';
import React, { useEffect, useState } from 'react';

const ConvertToDraftModal = ({ visible, onCancel, onOk, document }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // 获取分类列表
    const fetchCategories = async () => {
      try {
        const { data } = await getAllCategories();
        setCategories(data || []);
      } catch (error) {
        message.error('获取分类失败');
      }
    };
    if (visible) {
      fetchCategories();
    }
  }, [visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // 处理分类值（可能是数组）
      let categoryValue = values.category;
      if (Array.isArray(categoryValue)) {
        categoryValue = categoryValue[0];
      }
      
      // 检查是否需要创建新分类
      if (categoryValue) {
        try {
          const { data: categories } = await getAllCategories();
          if (!categories.includes(categoryValue)) {
            // 创建新分类
            await createCategory({ name: categoryValue });
            message.success(`新分类 "${categoryValue}" 创建成功！`);
          }
        } catch (error) {
          if (error.response?.status === 406) {
            message.error(error.response?.data?.message || '分类创建失败');
            setLoading(false);
            return;
          }
          // 如果是其他错误，继续转换
          console.warn('检查分类时出错:', error);
        }
      }
      
      await convertDocumentToDraft(document.id, categoryValue);
      message.success('转换成功！');
      
      form.resetFields();
      onOk && onOk();
    } catch (error) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      message.error(error.message || '转换失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel && onCancel();
  };

  return (
    <Modal
      title="转换为草稿"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnClose
    >
      <div style={{ marginBottom: '16px' }}>
        <p>将文档 <strong>"{document?.title}"</strong> 转换为草稿？</p>
        <p style={{ color: '#666', fontSize: '14px' }}>
          转换后，原文档将被删除，内容将作为草稿保存。
        </p>
      </div>
      
      <Form form={form} layout="vertical">
        <Form.Item
          name="category"
          label="选择分类"
          rules={[{ required: true, message: '请选择分类' }]}
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
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConvertToDraftModal; 