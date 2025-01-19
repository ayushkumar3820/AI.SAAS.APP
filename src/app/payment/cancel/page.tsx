import { clearCache } from "@/actions/commonActions";
import prisma from "@/lib/db.config";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { TransactionStatus } from "@/types";

// Add generateMetadata function instead of static metadata
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Payment Cancelled",
    description: "Payment was cancelled by the user",
  };
}

// Define Props properly
type PageProps = {
  params: Record<string, never>;
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function CancelTxn({ searchParams }: PageProps) {
  // Type guard for txnId
  const txnId = typeof searchParams.txnId === 'string' ? searchParams.txnId : null;
  
  if (!txnId) {
    return notFound();
  }

  try {
    // Check if transaction exists
    const transaction = await prisma.transactions.findUnique({
      where: {
        id: txnId,
        status: TransactionStatus.INITIAL, // Use enum value (2)
      },
    });

    if (!transaction) {
      return notFound();
    }

    // Update transaction status
    await prisma.transactions.update({
      where: {
        id: txnId,
      },
      data: {
        status: TransactionStatus.CANCELLED, // Use enum value (0)
      },
    });

    // Clear cache
    await clearCache("transactions");

    return (
      <main className="h-screen flex justify-center items-center flex-col">
        <Image
          src="/image/cancel.png"
          width={512}
          height={512}
          alt="Payment cancelled"
          priority
        />
        <h1 className="text-3xl font-bold text-red-400">
          Payment Canceled by the user
        </h1>
      </main>
    );

  } catch (error) {
    console.error("Error processing cancellation:", error);
    return (
      <main className="h-screen flex justify-center items-center flex-col">
        <h1 className="text-3xl font-bold text-red-500">
          Error processing cancellation
        </h1>
        <p className="text-gray-600 mt-4">
          Please contact support if this issue persists
        </p>
      </main>
    );
  }
}