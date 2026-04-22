import React from 'react';

// ANSI 颜色代码映射
const ANSI_COLORS: { [key: string]: string } = {
  // 前景色
  '30': '#000000', // 黑色
  '31': '#ff5555', // 红色
  '32': '#50fa7b', // 绿色
  '33': '#f1fa8c', // 黄色
  '34': '#bd93f9', // 蓝色
  '35': '#ff79c6', // 品红
  '36': '#8be9fd', // 青色
  '37': '#f8f8f2', // 白色
  
  // 高亮前景色
  '90': '#6272a4', // 亮黑色（灰色）
  '91': '#ff6e6e', // 亮红色
  '92': '#69ff94', // 亮绿色
  '93': '#ffffa5', // 亮黄色
  '94': '#d6acff', // 亮蓝色
  '95': '#ff92df', // 亮品红
  '96': '#a4ffff', // 亮青色
  '97': '#ffffff', // 亮白色
};

interface AnsiSegment {
  text: string;
  color?: string;
  bold?: boolean;
}

/**
 * 解析 ANSI 颜色代码并转换为带样式的片段
 */
export function parseAnsiColors(text: string): AnsiSegment[] {
  const segments: AnsiSegment[] = [];
  
  // 匹配多种 ANSI 转义序列格式:
  // 1. \x1b[...m (标准格式)
  // 2. \033[...m (八进制格式)
  // 3. [数字;数字m (裸格式，可能是转义后的)
  const ansiRegex = /(?:\x1b|\x1b)?\[([0-9;]+)m/g;
  
  let lastIndex = 0;
  let currentColor: string | undefined;
  let currentBold = false;
  let match;

  while ((match = ansiRegex.exec(text)) !== null) {
    // 添加前面的文本
    if (match.index > lastIndex) {
      const textContent = text.substring(lastIndex, match.index);
      if (textContent) {
        segments.push({
          text: textContent,
          color: currentColor,
          bold: currentBold
        });
      }
    }

    // 解析 ANSI 代码
    const codes = match[1].split(';');
    
    for (const code of codes) {
      if (code === '0') {
        // 重置所有样式
        currentColor = undefined;
        currentBold = false;
      } else if (code === '1') {
        // 粗体/高亮
        currentBold = true;
      } else if (code === '22') {
        // 取消粗体
        currentBold = false;
      } else if (ANSI_COLORS[code]) {
        // 设置颜色
        currentColor = ANSI_COLORS[code];
      }
    }

    lastIndex = ansiRegex.lastIndex;
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    const textContent = text.substring(lastIndex);
    if (textContent) {
      segments.push({
        text: textContent,
        color: currentColor,
        bold: currentBold
      });
    }
  }

  // 如果没有任何 ANSI 代码，返回原始文本
  if (segments.length === 0) {
    segments.push({ text });
  }

  return segments;
}

/**
 * 将 ANSI 颜色文本转换为 React 元素
 */
export function renderAnsiText(text: string): React.ReactNode {
  const segments = parseAnsiColors(text);
  
  return segments.map((segment, index) => {
    const style: React.CSSProperties = {};
    
    if (segment.color) {
      style.color = segment.color;
    }
    
    if (segment.bold) {
      style.fontWeight = 'bold';
    }
    
    // 如果有样式，用 span 包裹
    if (Object.keys(style).length > 0) {
      return (
        <span key={index} style={style}>
          {segment.text}
        </span>
      );
    }
    
    // 否则直接返回文本
    return segment.text;
  });
}
