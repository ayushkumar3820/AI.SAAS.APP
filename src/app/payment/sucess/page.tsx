/* eslint-disable @typescript-eslint/no-unused-vars */
import { addCoins, clearCache } from "@/actions/commonActions";
import prisma from "@/lib/db.config";
import { notFound } from "next/navigation";
import React from "react";
import Image from "next/image";

// Add metadata export (optional but recommended)
export const metadata = {
  title: 'Payment Success',
  description: 'Payment success page',
}

async function getTransaction(txnId: string) {
  try {
    // Convert string to UUID format and find transaction
    return await prisma.transactions.findUnique({
      where: {
        id: txnId
      },
      include: {
        user: true // Include user data if needed
      }
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  console.log("Received searchParams:", searchParams); // Debug log

  try {
    const txnId = searchParams["txnId"];
    if (!txnId) {
      console.error("Payment Success: txnId is missing");
      return notFound();
    }

    const transaction = await getTransaction(txnId);
    console.log("Transaction found:", transaction); // Debug log

    if (!transaction) {
      console.error(`Payment Success: No transaction found for ${txnId}`);
      return notFound();
    }

    // Check if already completed
    if (transaction.status === 3) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Payment Already Processed</h1>
            <div className="my-4">
              <p>Amount: ${transaction.amount}</p>
              <p>Transaction ID: {transaction.id}</p>
            </div>
            <Image 
              src="/success-image.png" 
              alt="Success" 
              width={200} 
              height={200}
              priority
            />
          </div>
        </div>
      );
    }

    // Process transaction
    if (transaction.status === 1 || transaction.status === 2) {
      try {
        await prisma.$transaction(async (tx) => {
          // Update transaction status
          await tx.transactions.update({
            where: { id: txnId },
            data: { status: 3 }
          });

          // Add coins to user account
          await prisma.user.update({
            where: { id: transaction.user_id },
            data: {
              coins: {
                increment: transaction.amount
              }
            }
          });
        });

        // Clear caches
        await Promise.all([
          clearCache("userCoins"),
          clearCache("transactions")
        ]);

      } catch (error) {
        console.error("Error processing transaction:", error);
        // Mark as failed
        await prisma.transactions.update({
          where: { id: txnId },
          data: { status: 4 }
        });
        throw error;
      }
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Payment Processed Successfully!</h1>
          <div className="my-4">
            <p>Amount: ${transaction.amount}</p>
            <p>Transaction ID: {transaction.id}</p>
          </div>
          <Image 
            src="/success-image.png" 
            alt="Success" 
            width={200} 
            height={200}
            priority
          />
        </div>
      </div>
    );

  } catch (error) {
    console.error("Payment Success Critical Error:", error);
    throw error;
  }
}