import { useState, useCallback, useEffect, useRef } from "react";

interface PanelBounds {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
}

interface UseResizablePanelsOptions {
  left?: Partial<PanelBounds>;
  right?: Partial<PanelBounds>;
}

export function useResizablePanels(options?: UseResizablePanelsOptions) {
  const leftConfig: PanelBounds = {
    defaultWidth: 260,
    minWidth: 180,
    maxWidth: 440,
    ...options?.left,
  };

  const rightConfig: PanelBounds = {
    defaultWidth: 340,
    minWidth: 260,
    maxWidth: 580,
    ...options?.right,
  };

  const [leftWidth, setLeftWidth] = useState<number>(leftConfig.defaultWidth);
  const [rightWidth, setRightWidth] = useState<number>(rightConfig.defaultWidth);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);
  const [isDraggingLeft, setIsDraggingLeft] = useState<boolean>(false);
  const [isDraggingRight, setIsDraggingRight] = useState<boolean>(false);

  const prevLeftWidthRef = useRef<number>(leftConfig.defaultWidth);
  const prevRightWidthRef = useRef<number>(rightConfig.defaultWidth);
  const isDraggingRef = useRef<"left" | "right" | null>(null);

  const startLeftResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isLeftCollapsed) {
      setIsLeftCollapsed(false);
    }
    isDraggingRef.current = "left";
    setIsDraggingLeft(true);
    document.body.classList.add("resizing-horizontal");
  }, [isLeftCollapsed]);

  const startRightResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isRightCollapsed) {
      setIsRightCollapsed(false);
    }
    isDraggingRef.current = "right";
    setIsDraggingRight(true);
    document.body.classList.add("resizing-horizontal");
  }, [isRightCollapsed]);

  const toggleLeftCollapse = useCallback(() => {
    setIsLeftCollapsed(prev => {
      if (!prev) {
        prevLeftWidthRef.current = leftWidth;
        return true;
      } else {
        setLeftWidth(prevLeftWidthRef.current || leftConfig.defaultWidth);
        return false;
      }
    });
  }, [leftWidth, leftConfig.defaultWidth]);

  const toggleRightCollapse = useCallback(() => {
    setIsRightCollapsed(prev => {
      if (!prev) {
        prevRightWidthRef.current = rightWidth;
        return true;
      } else {
        setRightWidth(prevRightWidthRef.current || rightConfig.defaultWidth);
        return false;
      }
    });
  }, [rightWidth, rightConfig.defaultWidth]);

  const resetLeftWidth = useCallback(() => {
    setIsLeftCollapsed(false);
    setLeftWidth(leftConfig.defaultWidth);
  }, [leftConfig.defaultWidth]);

  const resetRightWidth = useCallback(() => {
    setIsRightCollapsed(false);
    setRightWidth(rightConfig.defaultWidth);
  }, [rightConfig.defaultWidth]);

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (isDraggingRef.current === "left") {
        const newWidth = Math.max(leftConfig.minWidth, Math.min(clientX, leftConfig.maxWidth));
        setLeftWidth(newWidth);
      } else if (isDraggingRef.current === "right") {
        const windowWidth = window.innerWidth;
        const newWidth = Math.max(rightConfig.minWidth, Math.min(windowWidth - clientX, rightConfig.maxWidth));
        setRightWidth(newWidth);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      handleMove(e.clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !e.touches[0]) return;
      handleMove(e.touches[0].clientX);
    };

    const onEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = null;
        setIsDraggingLeft(false);
        setIsDraggingRight(false);
        document.body.classList.remove("resizing-horizontal");
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
      document.body.classList.remove("resizing-horizontal");
    };
  }, [leftConfig.minWidth, leftConfig.maxWidth, rightConfig.minWidth, rightConfig.maxWidth]);

  return {
    leftWidth: isLeftCollapsed ? 0 : leftWidth,
    rightWidth: isRightCollapsed ? 0 : rightWidth,
    isLeftCollapsed,
    isRightCollapsed,
    isDraggingLeft,
    isDraggingRight,
    startLeftResize,
    startRightResize,
    toggleLeftCollapse,
    toggleRightCollapse,
    resetLeftWidth,
    resetRightWidth,
  };
}
