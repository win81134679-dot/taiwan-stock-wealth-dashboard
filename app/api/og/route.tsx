// OG 圖動態生成 (Next.js 16 ImageResponse)
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
        {/* 主視覺圓環 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            border: '8px solid rgba(216,180,110,0.3)',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)',
            marginBottom: '48px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#f4e3b8',
            }}
          >
            <div style={{ fontSize: '72px', fontWeight: 'bold', marginBottom: '8px' }}>台股</div>
            <div style={{ fontSize: '48px', opacity: 0.8 }}>資產總覽</div>
          </div>
        </div>

        {/* 標題與描述 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: '#aab6cc',
            fontSize: '32px',
          }}
        >
          <div style={{ marginBottom: '12px' }}>即時投資組合管理</div>
          <div style={{ opacity: 0.7, fontSize: '28px' }}>PRIVATE WEALTH · 台股</div>
        </div>

        {/* 底部裝飾 */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: '#6f7a8f',
            fontSize: '24px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#f06459',
            }}
          ></div>
          <div>盤中即時更新</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
