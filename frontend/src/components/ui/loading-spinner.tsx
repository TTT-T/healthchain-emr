export function LoadingSpinner() {
    return (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-blue-600" />
        </div>
    );
}
