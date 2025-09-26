interface ErrorMessageProps {
    message: string | null;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
    if (!message) return null;
    
    return (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md mb-4">
            {message}
        </div>
    );
}
