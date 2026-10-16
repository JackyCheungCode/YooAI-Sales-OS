import { Tile, Tag } from '@carbon/react';
import { Ai, ArrowRight } from '@carbon/react/icons';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  plannedCapabilities: string[];
};

export function ModulePlaceholderPage({ eyebrow, title, description, plannedCapabilities }: Props) {
  const navigate = useNavigate();

  return (
    <div className="module-placeholder-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p className="page-subtitle">{description}</p>
        </div>
        <Button renderIcon={Ai} onClick={() => navigate('/agents')}>AI 智能体中心</Button>
      </div>
      <Tile className="panel module-placeholder-panel">
        <div className="panel__heading">
          <div><h2>模块建设计划</h2><p>菜单和路由已纳入模块化架构，以下能力尚未完成业务实现。</p></div>
          <Tag type="warm-gray">规划中</Tag>
        </div>
        <div className="module-placeholder-list">
          {plannedCapabilities.map((capability, index) => (
            <div className="module-placeholder-item" key={capability}>
              <span className="module-placeholder-item__number">{String(index + 1).padStart(2, '0')}</span>
              <span>{capability}</span>
            </div>
          ))}
        </div>
        <div className="module-placeholder-footer">
          <span>不会使用虚构数据伪装成真实业务记录。</span>
          <Button kind="ghost" renderIcon={ArrowRight} onClick={() => navigate('/dashboard')}>返回全球客户看板</Button>
        </div>
      </Tile>
    </div>
  );
}
