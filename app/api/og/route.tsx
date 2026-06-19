// OG 圖動態生成 - 極簡風格
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#d8b46e',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 左側:圖示 + 標題 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {/* 圖示 (與 PWA icon 一致) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '200px',
              height: '200px',
              background: '#0f1419',
              borderRadius: '32px',
            }}
          >
            {/* 箭頭 */}
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <path
                d="M60 20 L90 50 H72 V100 H48 V50 H30 Z"
                fill="#d8b46e"
              />
              <rect x="30" y="85" width="60" height="25" rx="4" fill="#d8b46e" />
            </svg>
          </div>

          {/* 標題 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                fontSize: '82px',
                fontWeight: 'bold',
                color: '#0f1419',
                lineHeight: 1,
              }}
            >
              台股資產總覽
            </div>
            <div
              style={{
                fontSize: '36px',
                color: 'rgba(15, 20, 25, 0.7)',
                lineHeight: 1.3,
              }}
            >
              即時投資組合管理
            </div>
          </div>
        </div>

        {/* 右側:特色標籤 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              background: '#0f1419',
              color: '#d8b46e',
              fontSize: '28px',
              padding: '20px 40px',
              borderRadius: '16px',
              fontWeight: 500,
            }}
          >
            ⚡ 盤中即時更新
          </div>
          <div
            style={{
              background: '#0f1419',
              color: '#d8b46e',
              fontSize: '28px',
              padding: '20px 40px',
              borderRadius: '16px',
              fontWeight: 500,
            }}
          >
            📊 資產配置分析
          </div>
          <div
            style={{
              background: '#0f1419',
              color: '#d8b46e',
              fontSize: '28px',
              padding: '20px 40px',
              borderRadius: '16px',
              fontWeight: 500,
            }}
          >
            📈 損益追蹤
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
