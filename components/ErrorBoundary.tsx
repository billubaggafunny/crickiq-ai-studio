import React, { Component, ErrorInfo, ReactNode } from 'react';
import CrickIQCard from './CrickIQCard';

type Props = {
    children: ReactNode;
    componentName: string;
    onReset?: () => void;
};

type State = {
    hasError: boolean;
    error: Error | null;
};

class ErrorBoundary extends React.Component<Props, State> {
    public override state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[ErrorBoundary] Caught error in ${this.props.componentName}:`, error, errorInfo);
        
        try {
            const logs = JSON.parse(localStorage.getItem('crickiq_error_logs') || '[]');
            logs.push({
                component: this.props.componentName,
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString()
            });
            if (logs.length > 50) logs.shift();
            localStorage.setItem('crickiq_error_logs', JSON.stringify(logs));
        } catch (e) {
            // Ignore format errors or local storage space limits
        }
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    private handleReturnHome = () => {
        window.location.reload(); 
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <CrickIQCard className="max-w-md w-full bg-white dark:bg-secondary border-t-4 border-t-red-500 shadow-xl overflow-hidden">
                        <div className="p-6 text-center space-y-4">
                            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="text-2xl font-bold text-text-primary">Something went wrong</h2>
                            <p className="text-text-secondary text-sm">
                                An unexpected error occurred in the <span className="font-semibold text-text-primary">{this.props.componentName}</span> section. Your saved match data is safe.
                            </p>
                            
                            {this.state.error && (
                                <div className="text-left bg-red-50 dark:bg-red-950/20 p-3 rounded-lg overflow-x-auto text-xs font-mono text-red-700 dark:text-red-400 mt-4 mb-4 border border-red-100 dark:border-red-900/50">
                                    {this.state.error.message}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <button
                                    onClick={this.handleRetry}
                                    className="flex-1 py-2.5 px-4 bg-brand-blue/10 text-brand-blue rounded-xl font-semibold hover:bg-brand-blue/20 transition-colors"
                                >
                                    Retry Section
                                </button>
                                <button
                                    onClick={this.handleReturnHome}
                                    className="flex-1 py-2.5 px-4 bg-brand-blue text-white rounded-xl font-semibold hover:bg-brand-blue/90 transition-colors shadow-md shadow-brand-blue/20"
                                >
                                    Reload App
                                </button>
                            </div>
                        </div>
                    </CrickIQCard>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
