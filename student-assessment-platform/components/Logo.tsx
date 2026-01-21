/**
 * Logo Component
 * 
 * Simple logo component for the platform
 * 
 * @module components/Logo
 */

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-xl">S</span>
      </div>
      <span className="font-semibold text-lg text-gray-900">Student Assessment</span>
    </div>
  );
}

