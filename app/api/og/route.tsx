// OG 圖動態生成 - 品牌鑽石 Logo + 優雅暗色風格
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f1419 0%, #1a1f29 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 主視覺:鑽石 Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            border: '3px solid rgba(216,180,110,0.3)',
            background: 'radial-gradient(circle, rgba(216,180,110,0.08) 0%, transparent 70%)',
            marginBottom: '56px',
            position: 'relative',
          }}
        >
          {/* 鑽石 SVG */}
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
            <path
              d="M70 25 L45 65 L70 75 L95 65 Z"
              fill="#d8b46e"
              opacity="0.9"
            />
            <path
              d="M45 65 L70 115 L95 65 L70 75 Z"
              fill="#d8b46e"
            />
            <line x1="70" y1="25" x2="70" y2="115" stroke="#0f1419" strokeWidth="2" />
            <line x1="45" y1="65" x2="95" y2="65" stroke="#0f1419" strokeWidth="2" />
          </svg>
        </div>

        {/* 標題 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '76px',
              fontWeight: 'bold',
              color: '#f4e3b8',
              letterSpacing: '0.02em',
              marginBottom: '16px',
            }}
          >
            台股資產總覽
          </div>
          <div
            style={{
              fontSize: '32px',
              color: '#aab6cc',
              letterSpacing: '0.05em',
            }}
          >
            即時投資組合管理 · PRIVATE WEALTH
          </div>
        </div>

        {/* 底部特色標籤 */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(216,180,110,0.12)',
              padding: '16px 28px',
              borderRadius: '12px',
              border: '1px solid rgba(216,180,110,0.2)',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#f06459',
              }}
            ></div>
            <span style={{ color: '#edd49c', fontSize: '24px', fontWeight: 500 }}>
              盤中即時更新
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(216,180,110,0.12)',
              padding: '16px 28px',
              borderRadius: '12px',
              border: '1px solid rgba(216,180,110,0.2)',
            }}
          >
            <span style={{ color: '#edd49c', fontSize: '24px', fontWeight: 500 }}>
              📊 資產配置
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(216,180,110,0.12)',
              padding: '16px 28px',
              borderRadius: '12px',
              border: '1px solid rgba(216,180,110,0.2)',
            }}
          >
            <span style={{ color: '#edd49c', fontSize: '24px', fontWeight: 500 }}>
              📈 損益追蹤
            </span>
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
