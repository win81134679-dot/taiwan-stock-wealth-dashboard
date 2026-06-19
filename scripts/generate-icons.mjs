// 生成 PWA 圖示 - 透明背景 + 加粗鑽石 Logo
import fs from 'fs';
import { createCanvas } from 'canvas';

const sizes = [192, 512];

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 透明背景 (去背)
  ctx.clearRect(0, 0, size, size);

  const centerX = size / 2;
  const centerY = size / 2;

  // 外圈 (金色圓環,加粗)
  const outerRadius = size * 0.44;
  const ringWidth = size * 0.028; // 加粗接近 2 倍

  ctx.strokeStyle = '#d8b46e';
  ctx.lineWidth = ringWidth;
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 鑽石圖形 (金色,加粗)
  const diamondSize = size * 0.38; // 稍微放大
  ctx.fillStyle = '#d8b46e';

  // 上半部左三角
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - diamondSize * 0.58); // 頂點
  ctx.lineTo(centerX - diamondSize * 0.48, centerY - diamondSize * 0.08); // 左上
  ctx.lineTo(centerX, centerY + diamondSize * 0.08); // 中心
  ctx.closePath();
  ctx.fill();

  // 上半部右三角
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - diamondSize * 0.58); // 頂點
  ctx.lineTo(centerX + diamondSize * 0.48, centerY - diamondSize * 0.08); // 右上
  ctx.lineTo(centerX, centerY + diamondSize * 0.08); // 中心
  ctx.closePath();
  ctx.fill();

  // 下半部大三角
  ctx.beginPath();
  ctx.moveTo(centerX - diamondSize * 0.48, centerY - diamondSize * 0.08); // 左
  ctx.lineTo(centerX, centerY + diamondSize * 0.58); // 底點
  ctx.lineTo(centerX + diamondSize * 0.48, centerY - diamondSize * 0.08); // 右
  ctx.lineTo(centerX, centerY + diamondSize * 0.08); // 中心
  ctx.closePath();
  ctx.fill();

  // 鑽石內部輪廓線 (深色,增加立體感與辨識度)
  ctx.strokeStyle = 'rgba(15, 20, 25, 0.4)';
  ctx.lineWidth = size * 0.012; // 加粗線條
  ctx.lineJoin = 'miter';

  // 中央垂直線
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - diamondSize * 0.58);
  ctx.lineTo(centerX, centerY + diamondSize * 0.58);
  ctx.stroke();

  // 中央水平線
  ctx.beginPath();
  ctx.moveTo(centerX - diamondSize * 0.48, centerY - diamondSize * 0.08);
  ctx.lineTo(centerX + diamondSize * 0.48, centerY - diamondSize * 0.08);
  ctx.stroke();

  // 外輪廓描邊 (讓邊緣更清晰)
  ctx.strokeStyle = '#d8b46e';
  ctx.lineWidth = size * 0.006;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - diamondSize * 0.58);
  ctx.lineTo(centerX - diamondSize * 0.48, centerY - diamondSize * 0.08);
  ctx.lineTo(centerX, centerY + diamondSize * 0.58);
  ctx.lineTo(centerX + diamondSize * 0.48, centerY - diamondSize * 0.08);
  ctx.closePath();
  ctx.stroke();

  // 儲存為 PNG (支援透明)
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icon-${size}.png`, buffer);
  console.log(`✓ Generated icon-${size}.png (transparent, bold diamond)`);
}

sizes.forEach(generateIcon);
console.log('✓ All icons generated - Transparent background with bold logo!');
