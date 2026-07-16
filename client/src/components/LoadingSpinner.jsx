export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-900">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 rounded-full border-2 border-surface-600 border-t-brand-500 animate-spin" />
        {/* Inner glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full gradient-brand animate-pulse-soft opacity-60" />
        </div>
      </div>
      <p className="mt-6 text-text-secondary text-sm animate-pulse-soft">{text}</p>
    </div>
  );
}
