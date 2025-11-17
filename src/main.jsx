// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/src/main.jsx]
import React, { StrictMode } from 'react'; // 'React' をインポート
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

// --- ErrorBoundary コンポーネント (変更なし) ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // ... (フォールバックUI - 変更なし) ...
      return (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#18181b', color: '#f4f4f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f87171' }}>エラーが発生しました</h1>
          <p style={{ color: '#a1a1aa', marginTop: '1rem', maxWidth: '600px' }}>
            申し訳ありません、アプリの処理中に予期せぬエラーが発生しました。
            <br />
            開発者コンソール（F12）に詳細ログが出力されています。
          </p>
          <pre style={{ backgroundColor: '#27272a', color: '#f4f4f5', padding: '1rem', borderRadius: '0.5rem', marginTop: '1.5rem', textAlign: 'left', overflow: 'auto', maxWidth: '100%' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#0091ff', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ページをリロード
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
// --- ErrorBoundary ここまで ---

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <ErrorBoundary>
    {/* ▼▼▼ 【!!! 修正 !!!】 BrowserRouter に basename を設定 ▼▼▼ */}
    <BrowserRouter basename="/DJTIMEKEEPER/">
      <App />
    </BrowserRouter>
  </ErrorBoundary>
  // </StrictMode>,
);