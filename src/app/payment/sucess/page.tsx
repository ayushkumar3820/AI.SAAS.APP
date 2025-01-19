import { addCoins, clearCache } from "@/actions/commonActions";
import prisma from "@/lib/db.config";
import { getCoinsFromAmount } from "@/lib/utils";
import { notFound } from "next/navigation";
import React from "react";
import Image from "next/image";

export default async function SuccessTxn({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  try {
    // Validate txnId
    const txnId = searchParams["txnId"];
    if (!txnId) {
      console.error("Payment Success: txnId is missing in searchParams");
      return notFound();
    }

    // Find the transaction with less restrictive status check
    const transaction = await prisma.transactions.findFirst({
      where: {
        id: txnId,
        status: {
          in: [1, 2] // Allow both pending and processing status
        }
      },
    });

    if (!transaction) {
      console.error(`Payment Success: Transaction not found for txnId: ${txnId}`);
      return notFound();
    }

    // Prevent double processing
    if (transaction.status === 1) {
      console.log(`Payment Success: Transaction ${txnId} already processed`);
      return (
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Payment Already Processed</h1>
          <Image src="/success-image.png" alt="Success" width={200} height={200} />
        </div>
      );
    }

    // Update transaction status within a transaction
    await prisma.$transaction(async (tx) => {
      await tx.transactions.update({
        data: { status: 1 },
        where: { id: txnId }
      });

      await addCoins(transaction.user_id, getCoinsFromAmount(transaction.amount));
    });

    // Clear caches after successful update
    await Promise.all([
      clearCache("userCoins"),
      clearCache("transactions")
    ]);

    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Payment Processed Successfully!</h1>
        <Image src="/success-image.png" alt="Success" width={200} height={200} />
      </div>
    );

  } catch (error) {
    console.error("Payment Success: Error processing payment:", error);
    throw error; // Let Next.js error boundary handle it
  }
}