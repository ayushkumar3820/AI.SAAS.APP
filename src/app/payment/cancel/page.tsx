import { notFound } from "next/navigation";
import React from "react";

// Define the shape of the route's parameters
interface PageProps {
  params: { [key: string]: string };
}

export default function CancelPage({ params }: PageProps) {
  // Destructure the txnId from the params
  const { txnId } = params;

  // Handle cases where txnId is missing
  if (!txnId) {
    console.error("Transaction ID is missing");
    return notFound();
  }

  // Render the cancellation page
  return (
    <div>
      <h1>Payment Cancellation</h1>
      <p>The transaction with ID <strong>{txnId}</strong> has been canceled successfully.</p>
      <p>If you have any questions, please contact support.</p>
    </div>
  );
}
