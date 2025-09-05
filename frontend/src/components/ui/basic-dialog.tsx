interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

export function Dialog({ isOpen, onClose, children, title }: DialogProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />
            
            {/* Dialog */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                    {/* Header */}
                    {title && (
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold">{title}</h3>
                        </div>
                    )}
                    
                    {/* Content */}
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}
