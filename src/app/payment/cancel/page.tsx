import { notFound } from "next/navigation";
import prisma from "@/lib/db.config";
import { addCoins, clearCache } from "@/actions/commonActions";
import { getCoinsFromAmount } from "@/lib/utils";
import React from "react";

// Define the shape of the page props
interface PageProps {
  searchParams: { [key: string]: string | undefined };
}

export default async function SuccessTxn({ searchParams }: PageProps) {
  // Extract txnId from searchParams
  const txnId = searchParams["txnId"];

  // Handle missing txnId
  if (!txnId) {
    console.error("Transaction ID is missing");
    return notFound();
  }

  // Fetch the transaction from the database
  const transaction = await prisma.transactions.findFirst({
    where: {
      id: txnId,
      status: 2, // Ensure status is 2 (pending)
    },
  });

  // Log transaction for debugging
  console.log("The transaction is:", transaction);

  // Handle cases where the transaction does not exist
  if (!transaction) {
    return notFound();
  }

  // Update the transaction status to 1 (completed)
  await prisma.transactions.update({
    data: {
      status: 1,
    },
    where: {
      id: txnId,
    },
  });

  // Add coins to the user account and clear caches
  await addCoins(transaction.user_id, getCoinsFromAmount(transaction.amount));
  clearCache("userCoins");
  clearCache("transactions");

  // Return the success page
  return (
    <div>
      <h1>Payment Processed Successfully!</h1>
      <p>Transaction ID: <strong>{txnId}</strong></p>
      <p>Thank you for your payment. Your account has been updated.</p>
    </div>
  );
}
