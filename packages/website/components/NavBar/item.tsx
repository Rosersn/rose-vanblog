import Link from "next/link";
import { useRouter } from "next/router";
import { MouseEventHandler, useMemo, useState } from "react";
import { MenuItem } from "../../api/getAllData";

function LinkItemAtom(props: {
  item: MenuItem;
  onMouseEnter?: MouseEventHandler<HTMLLIElement>;
  onMouseLeave?: MouseEventHandler<HTMLLIElement>;
  children?: React.ReactNode;
  clsA?: string;
  cls?: string;
}) {
  const { item } = props;
  const router = useRouter();
  
  // 检查当前路由是否匹配导航项
  const isActive = useMemo(() => {
    const currentPath = router.pathname;
    const itemPath = item.value;
    
    // 首页特殊处理
    if (itemPath === '/' && currentPath === '/') {
      return true;
    }
    
    // 其他页面：如果当前路径以导航项路径开头，则为激活状态
    if (itemPath !== '/' && currentPath.startsWith(itemPath)) {
      return true;
    }
    
    return false;
  }, [router.pathname, item.value]);
  
  const cls = `nav-item transform hover:scale-110 dark:border-nav-dark dark:transition-all ua ${isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}`;
  const clsA = `h-full flex items-center px-2 md:px-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`;
  
  if (item.value.includes("http")) {
    return (
      <li
        onMouseEnter={props?.onMouseEnter}
        onMouseLeave={props?.onMouseLeave}
        key={item.id}
        className={props.cls ? props.cls : cls}
      >
        <a
          className={props.clsA ? props.clsA : clsA}
          href={item.value}
          target="_blank"
        >
          {item.name}
        </a>
        {props?.children}
      </li>
    );
  } else {
    return (
      <li
        onMouseEnter={props?.onMouseEnter}
        onMouseLeave={props?.onMouseLeave}
        key={item.id}
        className={props.cls ? props.cls : cls}
      >
        <Link href={item.value} style={{ height: "100%" }}>
          <div className={props.clsA ? props.clsA : clsA}>{item.name}</div>
        </Link>
      </li>
    );
  }
}

function LinkItemWithChildren(props: { item: MenuItem }) {
  const { item } = props;
  const [hover, setHover] = useState(false);
  const [hoverSub, setHoverSub] = useState(false);
  const router = useRouter();
  
  // 检查当前路由是否匹配任何子菜单项
  const isParentActive = useMemo(() => {
    const currentPath = router.pathname;
    
    // 检查父菜单项本身是否激活
    if (item.value === '/' && currentPath === '/') {
      return true;
    }
    if (item.value !== '/' && currentPath.startsWith(item.value)) {
      return true;
    }
    
    // 检查子菜单项是否有激活的
    return item.children?.some(child => {
      if (child.value === '/' && currentPath === '/') {
        return true;
      }
      if (child.value !== '/' && currentPath.startsWith(child.value)) {
        return true;
      }
      return false;
    }) || false;
  }, [router.pathname, item.value, item.children]);
  
  const show = useMemo(() => {
    return hover || hoverSub;
  }, [hover, hoverSub]);

  return (
    <>
      <div className="h-full relative">
        <LinkItemAtom
          item={item}
          onMouseEnter={() => {
            setHover(true);
          }}
          onMouseLeave={() => {
            setHover(false);
          }}
          cls={`nav-item transform hover:scale-110 dark:border-nav-dark dark:transition-all ua ${isParentActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}`}
          clsA={`h-full flex items-center px-2 md:px-4 ${isParentActive ? 'text-blue-600 dark:text-blue-400' : ''}`}
        />

        <div
          className="card-shadow bg-white block transition-all dark:text-dark dark:bg-dark-1 dark:card-shadow-dark"
          style={{
            position: "absolute",
            minWidth: 100,
            top: 50,
            left: "-4px",
            transform: show ? "scale(100%)" : "scale(0)",
            zIndex: 80,
          }}
          onMouseEnter={() => {
            setHoverSub(true);
          }}
          onMouseLeave={() => {
            setHoverSub(false);
          }}
        >
          {item.children?.map((c) => {
            return (
              <LinkItemAtom
                item={c}
                key={c.id}
                clsA={"h-full flex items-center px-2 md:px-4 py-2 "}
                cls={
                  "transition-all cursor-pointer flex items-center h-full hover:bg-gray-300 transition-all dark:hover:bg-dark-2  dark:text-dark dark:hover:text-dark-hover"
                }
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function (props: { item: MenuItem }) {
  const { item } = props;
  if (!item.children) {
    return <LinkItemAtom item={item} />;
  } else {
    return <LinkItemWithChildren item={item} />;
  }
}
