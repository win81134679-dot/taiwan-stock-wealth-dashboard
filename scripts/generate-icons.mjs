// 生成 PWA 圖示 (使用 Canvas)
import fs from 'fs';
import { createCanvas } from 'canvas';

const sizes = [192, 512];

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 背景漸層
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#0f1419');
  gradient.addColorStop(1, '#1a1f29');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // 中心圓環
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const ringWidth = size * 0.06;

  // 外環 (金色)
  ctx.strokeStyle = 'rgba(216,180,110,0.4)';
  ctx.lineWidth = ringWidth;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 內環 (紅色弧,象徵漲幅)
  ctx.strokeStyle = '#f06459';
  ctx.lineWidth = ringWidth * 0.6;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - ringWidth, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // 中心文字
  ctx.fillStyle = '#f4e3b8';
  ctx.font = `bold ${size * 0.16}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('台股', centerX, centerY - size * 0.05);

  ctx.font = `${size * 0.1}px sans-serif`;
  ctx.fillStyle = 'rgba(244,227,184,0.7)';
  ctx.fillText('資產', centerX, centerY + size * 0.08);

  // 儲存
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icon-${size}.png`, buffer);
  console.log(`✓ Generated icon-${size}.png`);
}

sizes.forEach(generateIcon);
console.log('✓ All icons generated');
