import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Preserve the original exception and component stack for diagnosis.
    console.error('[YooAI Sales OS] Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-screen" role="alert">
          <section className="app-error-card">
            <p className="app-error-eyebrow">YOOAI SALES OS</p>
            <h1>页面暂时无法显示</h1>
            <p>应用遇到未处理的显示错误。请重新载入页面；如果问题再次出现，请记录浏览器控制台中的错误信息。</p>
            <button type="button" onClick={() => window.location.reload()}>
              重新载入
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
