export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-cream">
            <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-4 border-sage border-t-transparent rounded-full animate-spin"></div>
                <p className="text-charcoal/60 font-medium">Loading...</p>
            </div>
        </div>
    );
}
