/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          Error Processing Payment
        </h2>
        <p className="mb-4 text-gray-600">
          There was an error processing your payment. Please try again or contact support.
        </p>
        <button
          onClick={reset}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}