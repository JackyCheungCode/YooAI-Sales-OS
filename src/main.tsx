import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { AuthProvider } from './app/AuthContext';
import './components/carbon/register';
import './styles/carbon.scss';
import './styles/carbon-tokens.css';
import './styles/global.css';

class AppRenderBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main role="alert" className="app-render-error">
          <h1>页面加载遇到错误</h1>
          <p>登录状态检查已结束，但应用页面渲染失败。请截图保存以下错误信息。</p>
          <pre>{this.state.error.message || String(this.state.error)}</pre>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRenderBoundary>
          <App />
        </AppRenderBoundary>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
