/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { clearCache } from "@/actions/commonActions";
import prisma from "@/lib/db.config";
import Image from "next/image";
import { notFound } from "next/navigation";
import React from "react";

type Props = {
  params: {};
  searchParams: {
    txnId?: string;
  };
}

export default async function CancelTxn({
  params,
  searchParams,
}: Props) {
  const txnId = searchParams["txnId"];
  if (!txnId) {
    return notFound(); // Handle missing txnId
  }

  const transaction = await prisma.transactions.findUnique({
    where: {
      status: 2,
      id: txnId,
    },
  });
  console.log("The transaction is", transaction);
  if (!transaction) {
    return notFound();
  }

  await prisma.transactions.update({
    data: {
      status: 0,
    },
    where: {
      id: txnId,
    },
  });
  clearCache("transactions");

  return (
    <div className="h-screen flex justify-center items-center flex-col ">
      <Image src="/image/cancel.png" width={512} height={512} alt="cancel" />
      <h1 className="text-3xl font-bold text-red-400">
        Payment Canceled by the user
      </h1>
    </div>
  );
}