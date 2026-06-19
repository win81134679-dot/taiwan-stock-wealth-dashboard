// 生成 PWA 圖示 - 使用品牌鑽石 Logo
import fs from 'fs';
import { createCanvas } from 'canvas';

const sizes = [192, 512];

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 深色背景 (與網站一致)
  ctx.fillStyle = '#0a111d';
  ctx.fillRect(0, 0, size, size);

  // 外圈 (金色圓環)
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size * 0.42;
  const ringWidth = size * 0.015;

  ctx.strokeStyle = '#d8b46e';
  ctx.lineWidth = ringWidth;
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 鑽石圖形 (金色)
  const diamondSize = size * 0.32;
  ctx.fillStyle = '#d8b46e';

  ctx.beginPath();
  // 上半部 (兩個三角形)
  ctx.moveTo(centerX, centerY - diamondSize * 0.55); // 頂點
  ctx.lineTo(centerX - diamondSize * 0.45, centerY - diamondSize * 0.1); // 左上
  ctx.lineTo(centerX, centerY + diamondSize * 0.05); // 中心
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - diamondSize * 0.55); // 頂點
  ctx.lineTo(centerX + diamondSize * 0.45, centerY - diamondSize * 0.1); // 右上
  ctx.lineTo(centerX, centerY + diamondSize * 0.05); // 中心
  ctx.closePath();
  ctx.fill();

  // 下半部 (鑽石底部)
  ctx.beginPath();
  ctx.moveTo(centerX - diamondSize * 0.45, centerY - diamondSize * 0.1); // 左
  ctx.lineTo(centerX, centerY + diamondSize * 0.55); // 底點
  ctx.lineTo(centerX + diamondSize * 0.45, centerY - diamondSize * 0.1); // 右
  ctx.lineTo(centerX, centerY + diamondSize * 0.05); // 中心
  ctx.closePath();
  ctx.fill();

  // 鑽石內部線條 (增加立體感)
  ctx.strokeStyle = '#0a111d';
  ctx.lineWidth = size * 0.008;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - diamondSize * 0.55);
  ctx.lineTo(centerX, centerY + diamondSize * 0.55);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX - diamondSize * 0.45, centerY - diamondSize * 0.1);
  ctx.lineTo(centerX + diamondSize * 0.45, centerY - diamondSize * 0.1);
  ctx.stroke();

  // 儲存
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icon-${size}.png`, buffer);
  console.log(`✓ Generated icon-${size}.png (diamond logo)`);
}

sizes.forEach(generateIcon);
console.log('✓ All icons generated - Brand diamond logo!');
