export default function Loading() {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <h2 className="text-xl font-bold mt-4">Processing Payment...</h2>
        </div>
      </div>
    )
  }