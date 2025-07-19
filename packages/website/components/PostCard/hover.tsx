import { useEffect, useRef, useState } from 'react';
import styles from '../../styles/post-card-hover.module.css';

interface PostCardHoverProps {
  children: React.ReactNode;
}

export default function PostCardHover({ children }: PostCardHoverProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // 检测是否为移动设备
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // 小于768px认为是移动设备
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  useEffect(() => {
    const card = cardRef.current;
    if (!card || isMobile) return; // 在移动设备上不应用倾斜效果
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // 减小倾斜角度，使效果更微妙
      const tiltX = ((y - centerY) / centerY) * 1.5;
      const tiltY = ((centerX - x) / centerX) * 1.5;
      
      // 添加轻微的上升效果
      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`;
    };
    
    const handleMouseLeave = () => {
      // 鼠标离开时平滑恢复
      card.style.transition = 'transform 0.5s ease';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    };
    
    const handleMouseEnter = () => {
      // 鼠标进入时，首先应用过渡效果
      card.style.transition = 'transform 0.2s ease';
      setTimeout(() => {
        // 短暂延迟后移除过渡效果，使鼠标移动时的倾斜更平滑
        if (card) {
          card.style.transition = 'box-shadow 0.3s ease';
        }
      }, 100);
    };
    
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    card.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      card.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isMobile]);
  
  return (
    <div ref={cardRef} className={`${styles.postCardHover} ${isMobile ? '' : styles.postCardTilt}`}>
      {children}
    </div>
  );
} 