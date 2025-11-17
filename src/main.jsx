// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-db4819ead3cea781e61d33b885b764c6c79391fb/src/main.jsx]
import React, { StrictMode } from 'react'; // 'React' をインポート
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import './index.css';
// ▼▼▼ 【!!! 追加 !!!】 react-router-dom からルーターをインポート ▼▼▼
import { BrowserRouter } from 'react-router-dom';

// --- ErrorBoundary コンポーネントを定義 ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // 次のレンダリングでフォールバックUIを表示するために状態を更新
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // エラーログをコンソールに出力
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // フォールバックUI
      return (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#18181b', color: '#f4f4f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f87171' }}>エラーが発生しました</h1>
          <p style={{ color: '#a1a1aa', marginTop: '1rem', maxWidth: '600px' }}>
            申し訳ありません、アプリの処理中に予期せぬエラーが発生しました。
            <br />
            開発者コンソール（F12）に詳細ログが出力されています。
          </p>
          <pre style={{ backgroundColor: '#2727a', color: '#f4f4f5', padding: '1rem', borderRadius: '0.5rem', marginTop: '1.5rem', textAlign: 'left', overflow: 'auto', maxWidth: '100%' }}>
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
  // <StrictMode> // StrictModeはD&Dライブラリ等と干渉することがあるため、開発中はコメントアウトのままで良いでしょう
  <ErrorBoundary>
    {/* ▼▼▼ 【!!! 修正 !!!】 App全体を BrowserRouter で囲む ▼▼▼ */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
  // </StrictMode>,
);