export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const baseStyles =
    'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
    secondary:
      'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100',
    outline:
      'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 disabled:border-gray-200 disabled:text-gray-400',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
    success:
      'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
