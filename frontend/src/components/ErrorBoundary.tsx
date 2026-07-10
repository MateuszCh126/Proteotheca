import React from 'react';

interface Props {
  label?: string;
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

/** Isolates a section so a render failure on unexpected real-API data
    degrades to a quiet notice instead of blanking the whole page. */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error(`Section "${this.props.label ?? 'unknown'}" failed to render:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-line bg-surface px-5 py-6 font-mono text-[12px] text-ink-3">
          This section couldn’t be rendered for the current data.
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
