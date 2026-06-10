"use client";

import React from "react";

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; }

// One bad section (e.g. malformed element JSON) should not blank the whole page.
export class SectionErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Section failed to render", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
