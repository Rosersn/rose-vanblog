import Headroom from "headroom.js";
import { useEffect, useRef } from "react";
import MarkdownTocBar from "../MarkdownTocBar";

export default function (props: {
  content: string;
  showSubMenu: "true" | "false";
}) {
  const headroomInstanceRef = useRef<Headroom | null>(null);
  
  useEffect(() => {
    const el = document.querySelector("#toc-card");
    if (el) {
      // 清理之前的实例
      const currentInstance = headroomInstanceRef.current;
      if (currentInstance && typeof currentInstance.destroy === 'function') {
        try {
          currentInstance.destroy();
        } catch (e) {
          console.warn('Error destroying headroom instance:', e);
        }
      }
      
      // 创建新的 Headroom 实例
      const headroom = new Headroom(el, {
        classes: {
          initial: `side-bar${
            props.showSubMenu == "true" ? "" : " no-submenu"
          }`,
          pinned: "side-bar-pinned",
          unpinned: "side-bar-unpinned",
          top: "side-bar-top",
          notTop: "side-bar-not-top",
        },
      });
      
      headroom.init();
      headroomInstanceRef.current = headroom;
    }
    
    // 清理函数
    return () => {
      const currentInstance = headroomInstanceRef.current;
      if (currentInstance && typeof currentInstance.destroy === 'function') {
        try {
          currentInstance.destroy();
        } catch (e) {
          console.warn('Error destroying headroom instance:', e);
        }
        headroomInstanceRef.current = null;
      }
    };
  }, [props.content, props.showSubMenu]); // 依赖于 content 和 showSubMenu

  return (
    <div className="sticky" id="toc-card">
      <div
        id="toc-container"
        className="bg-white w-60 card-shadow dark:card-shadow-dark ml-2 dark:bg-dark overflow-y-auto pb-2 rounded-lg"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        <MarkdownTocBar content={props.content} headingOffset={56} />
      </div>
    </div>
  );
}
