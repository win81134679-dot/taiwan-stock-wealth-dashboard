// 生成 PWA 圖示 - 極簡風格 (參考 Google Material Design)
import fs from 'fs';
import { createCanvas } from 'canvas';

const sizes = [192, 512];

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 純色背景 (品牌金色)
  ctx.fillStyle = '#d8b46e';
  ctx.fillRect(0, 0, size, size);

  // 極簡圖形:上升箭頭 + 方塊 (象徵台股上漲、資產增長)
  const centerX = size / 2;
  const centerY = size / 2;
  const iconSize = size * 0.5;

  ctx.fillStyle = '#0f1419';

  // 方塊底座 (象徵資產)
  const rectWidth = iconSize * 0.65;
  const rectHeight = iconSize * 0.35;
  const rectX = centerX - rectWidth / 2;
  const rectY = centerY + iconSize * 0.05;

  ctx.beginPath();
  ctx.roundRect(rectX, rectY, rectWidth, rectHeight, size * 0.04);
  ctx.fill();

  // 上升箭頭 (象徵台股漲勢)
  const arrowWidth = iconSize * 0.45;
  const arrowHeight = iconSize * 0.55;
  const arrowX = centerX;
  const arrowY = centerY - iconSize * 0.15;

  ctx.beginPath();
  // 箭頭尖端
  ctx.moveTo(arrowX, arrowY - arrowHeight / 2);
  ctx.lineTo(arrowX + arrowWidth / 2, arrowY);
  ctx.lineTo(arrowX + arrowWidth * 0.2, arrowY);
  // 箭頭柄
  ctx.lineTo(arrowX + arrowWidth * 0.2, arrowY + arrowHeight / 2);
  ctx.lineTo(arrowX - arrowWidth * 0.2, arrowY + arrowHeight / 2);
  ctx.lineTo(arrowX - arrowWidth * 0.2, arrowY);
  ctx.lineTo(arrowX - arrowWidth / 2, arrowY);
  ctx.closePath();
  ctx.fill();

  // 儲存
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icon-${size}.png`, buffer);
  console.log(`✓ Generated icon-${size}.png (minimalist style)`);
}

sizes.forEach(generateIcon);
console.log('✓ All icons generated - Simple & recognizable!');
