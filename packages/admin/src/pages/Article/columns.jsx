import ColumnsToolBar from '@/components/ColumnsToolBar';
import UpdateModal from '@/components/UpdateModal';
import { deleteArticle, getAllCategories, getArticleById, getTags, updateArticle } from '@/services/van-blog/api';
import { getPathname } from '@/services/van-blog/getPathname';
import { parseObjToMarkdown } from '@/services/van-blog/parseMarkdownFile';
import { PushpinFilled, PushpinOutlined } from '@ant-design/icons';
import { Button, InputNumber, message, Modal, Popover, Slider, Space, Tag, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { history } from 'umi';
import { genActiveObj } from '../../services/van-blog/activeColTools';

// 快速切换置顶状态
const handleToggleTop = async (record, action) => {
  const currentTop = record.top || 0;
  const newTop = currentTop > 0 ? 0 : 30; // 如果已置顶则取消，否则设为中等优先级
  
  try {
    await updateArticle(record.id, { top: newTop });
    const statusText = newTop > 0 ? `已置顶 (优先级${newTop})` : '已取消置顶';
    message.success(`文章"${record.title}" ${statusText}`);
    action?.reload();
  } catch (error) {
    message.error('置顶设置失败');
  }
};

// 设置具体的置顶值
const handleSetTopValue = async (record, topValue, action) => {
  try {
    await updateArticle(record.id, { top: topValue });
    const statusText = topValue > 0 ? `已设置置顶优先级为 ${topValue}` : '已取消置顶';
    message.success(`文章"${record.title}" ${statusText}`);
    action?.reload();
  } catch (error) {
    message.error('置顶设置失败');
  }
};

// 获取置顶值的显示标签
const getTopLabel = (topValue) => {
  if (topValue === 0) return '未置顶';
  if (topValue <= 20) return '低优先级';
  if (topValue <= 50) return '中优先级';
  return '高优先级';
};

// 获取置顶值的颜色
const getTopColor = (topValue) => {
  if (topValue === 0) return '#999';
  if (topValue <= 20) return '#52c41a';
  if (topValue <= 50) return '#faad14'; 
  return '#f5222d';
};

export const columns = [
  {
    dataIndex: 'id',
    valueType: 'number',
    title: 'ID',
    width: 40,
    search: false,
  },
  {
    title: '标题',
    dataIndex: 'title',
    width: 500,
    copyable: true,
    ellipsis: false,
    render: (text) => (
      <div
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 10,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
          lineHeight: '1.5'
        }}
      >
        {text}
      </div>
    ),
    formItemProps: {
      rules: [
        {
          required: true,
          message: '此项为必填项',
        },
      ],
    },
  },
  {
    title: '分类',
    dataIndex: 'category',
    valueType: 'select',
    width: 100,
    request: async () => {
      const { data: categories } = await getAllCategories();
      const data = categories.map((each) => ({
        label: each,
        value: each,
      }));
      return data;
    },
  },
  {
    title: '标签',
    dataIndex: 'tags',
    valueType: 'select',
    fieldProps: { showSearch: true, placeholder: '请搜索或选择' },
    width: 160,
    search: true,
    renderFormItem: (_, { defaultRender }) => {
      return defaultRender(_);
    },
    request: async () => {
      const { data: tags } = await getTags();
      const data = tags.map((each) => ({
        label: each,
        value: each,
      }));
      return data;
    },
    render: (val, record) => {
      if (!record?.tags?.length) {
        return '-';
      } else {
        return (
          <div
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 10,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
              lineHeight: '1.5'
            }}
          >
            {record?.tags?.map((each) => (
              <Tag style={{ marginBottom: 4 }} key={`tag-${each}`}>
                {each}
              </Tag>
            ))}
          </div>
        );
      }
    },
  },
  {
    title: '创建时间',
    key: 'showTime',
    dataIndex: 'createdAt',
    valueType: 'dateTime',
    sorter: true,
    hideInSearch: true,
    width: 180,
  },
  {
    title: '置顶',
    key: 'top',
    dataIndex: 'top',
    valueType: 'number',
    sorter: true,
    width: 120,
    hideInSearch: true,
    render: (text, record, _, action) => {
      const topValue = record.top || 0;
      const isTopPinned = topValue > 0;
      
      // 优先级调节面板组件
      const PriorityPanel = () => {
        const [currentValue, setCurrentValue] = useState(topValue);
        
        // 当原始值改变时同步状态
        useEffect(() => {
          setCurrentValue(topValue);
        }, [topValue]);
        
        // 处理数值输入失焦
        const handleInputBlur = (e) => {
          const value = parseInt(e.target.value) || 0;
          const clampedValue = Math.min(Math.max(value, 0), 100); // 限制范围 0-100
          if (clampedValue !== topValue) {
            handleSetTopValue(record, clampedValue, action);
          }
        };
        
        // 处理滑动条拖拽结束
        const handleSliderAfterChange = (value) => {
          if (value !== topValue) {
            handleSetTopValue(record, value, action);
          }
        };
        
        // 处理滑动条实时变化（只更新UI，不发请求）
        const handleSliderChange = (value) => {
          setCurrentValue(value);
        };
        
        return (
          <div style={{ padding: '12px', minWidth: '260px' }}>
            <div style={{ marginBottom: '16px', fontWeight: 'bold', fontSize: '14px' }}>设置置顶优先级</div>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <span style={{ marginRight: '8px' }}>精确值:</span>
                <InputNumber
                  min={0}
                  max={100}
                  value={currentValue}
                  onChange={setCurrentValue}
                  onBlur={handleInputBlur}
                  style={{ width: '80px' }}
                  size="small"
                />
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>(0-100)</span>
              </div>
              
              <div>
                <div style={{ marginBottom: '8px' }}>快速调节:</div>
                <Slider
                  min={0}
                  max={100}
                  value={currentValue}
                  onChange={handleSliderChange}
                  onAfterChange={handleSliderAfterChange}
                  marks={{
                    0: '关闭',
                    10: '低',
                    30: '中',
                    60: '高',
                    100: '最高'
                  }}
                  step={1}
                  tooltip={{
                    formatter: (value) => `优先级 ${value}`
                  }}
                  style={{ marginBottom: '8px' }}
                />
              </div>
              
              <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                • 0 = 取消置顶<br/>
                • 1-20 = 低优先级<br/>
                • 21-50 = 中优先级<br/>
                • 51+ = 高优先级
              </div>
            </Space>
          </div>
        );
      };
      
      // 优先级调节的内容
      const priorityContent = <PriorityPanel />;
      
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
          {/* 主要的置顶切换按钮 */}
          <Tooltip title={isTopPinned ? `已置顶 (优先级${topValue})` : '点击置顶文章'}>
            <Button
              type={isTopPinned ? 'primary' : 'default'}
              icon={isTopPinned ? <PushpinFilled /> : <PushpinOutlined />}
              size="small"
              onClick={() => handleToggleTop(record, action)}
              style={{
                borderColor: isTopPinned ? getTopColor(topValue) : undefined,
                backgroundColor: isTopPinned ? getTopColor(topValue) : undefined,
              }}
            >
              {isTopPinned ? topValue : '置顶'}
            </Button>
          </Tooltip>
          
          {/* 状态标签 */}
          <div style={{
            fontSize: '11px',
            color: getTopColor(topValue),
            fontWeight: '500',
            textAlign: 'center',
            lineHeight: '1.2'
          }}>
            {getTopLabel(topValue)}
          </div>
          
          {/* 优先级调节 - 只在已置顶时显示 */}
          {isTopPinned && (
            <Popover
              content={priorityContent}
              title={null}
              trigger="click"
              placement="leftTop"
            >
              <Button
                size="small"
                type="link"
                style={{ padding: '0', height: 'auto', fontSize: '11px', color: '#1890ff' }}
              >
                调节
              </Button>
            </Popover>
          )}
        </div>
      );
    },
  },
  {
    title: '浏览量',
    key: 'viewer',
    dataIndex: 'viewer',
    valueType: 'number',
    sorter: true,
    width: 60,
    hideInSearch: true,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    valueType: 'dateRange',
    hideInTable: true,
    search: {
      transform: (value) => {
        return {
          startTime: value[0],
          endTime: value[1],
        };
      },
    },
  },
  {
    title: '操作',
    valueType: 'option',
    key: 'option',
    width: 120,
    render: (text, record, _, action) => {
      return (
        <Space>
          <ColumnsToolBar
            outs={[
              <a
                key={'editable' + record.id}
                onClick={() => {
                  history.push(
                    `/editor?type=${record?.about ? 'about' : 'article'}&id=${record.id}`,
                  );
                }}
              >
                编辑
              </a>,
              <a
                href={`/post/${getPathname(record)}`}
                onClick={(ev) => {
                  if (record?.hidden) {
                    Modal.confirm({
                      title: '此文章为隐藏文章！',
                      content: (
                        <div>
                          <p>
                            隐藏文章在未开启通过 URL 访问的情况下（默认关闭），会出现 404 页面！
                          </p>
                          <p>
                            您可以在{' '}
                            <a
                              onClick={() => {
                                history.push('/site/setting?subTab=layout');
                              }}
                            >
                              布局配置
                            </a>{' '}
                            中修改此项。
                          </p>
                        </div>
                      ),
                      onOk: () => {
                        window.open(`/post/${getPathname(record)}`, '_blank');
                        return true;
                      },
                      okText: '仍然访问',
                      cancelText: '返回',
                    });
                    ev.preventDefault();
                  }
                }}
                target="_blank"
                rel="noopener noreferrer"
                key={'view' + record.id}
              >
                查看
              </a>,
            ]}
            nodes={[
              <UpdateModal
                currObj={record}
                setLoading={() => {}}
                type="article"
                onFinish={() => {
                  action?.reload();
                }}
              />,
              <a
                key={'exportArticle' + record.id}
                onClick={async () => {
                  const { data: obj } = await getArticleById(record.id);
                  const md = parseObjToMarkdown(obj);
                  const data = new Blob([md]);
                  const url = URL.createObjectURL(data);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${record.title}.md`;
                  link.click();
                }}
              >
                导出
              </a>,
              <a
                key={'deleteArticle' + record.id}
                onClick={() => {
                  Modal.confirm({
                    title: `确定删除 "${record.title}"吗？`,
                    onOk: async () => {
                      if (location.hostname == 'blog-demo.mereith.com') {
                        if ([28, 29].includes(record.id)) {
                          message.warn('演示站禁止删除此文章！');
                          return false;
                        }
                      }
                      await deleteArticle(record.id);
                      message.success('删除成功!');
                      action?.reload();
                    },
                  });
                }}
              >
                删除
              </a>,
            ]}
          />
        </Space>
      );
    },
  },
];
export const articleKeys = [
  'category',
  'id',
  'option',
  'showTime',
  'tags',
  'title',
  'top',
  'viewer',
];
export const articleKeysSmall = ['category', 'id', 'option', 'title'];
export const articleObjAll = genActiveObj(articleKeys, articleKeys);
export const articleObjSmall = genActiveObj(articleKeysSmall, articleKeys);