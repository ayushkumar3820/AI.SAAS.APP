import { NextRequest, NextResponse } from "next/server";
import { authOptions, CustomSession } from "../../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db.config";
import Stripe from "stripe";

interface SessionPayload {
  plan: string;
}

export async function POST(req: NextRequest) {
  const session: CustomSession | null = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: SessionPayload = await req.json();
    
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key is not configured");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // apiVersion: "2023-10-16",
    });

    // Get the product from the database
    const product = await prisma.products.findFirst({
      where: {
        name: body.plan
      }
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Verify the price exists in Stripe
    const price = await stripe.prices.retrieve(product.price_id);
    
    // Determine the correct mode based on the price type
    const mode = price.type === 'recurring' ? 'subscription' : 'payment';

    // Create a transaction record with the correct schema types
    const transaction = await prisma.transactions.create({
      data: {
        user: {
          connect: {
            id: Number(session.user.id)
          }
        },
        amount: product.amount,
        status: 2, // Default status from your schema
      }
    });

    // Common session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      currency: product.currency,
      billing_address_collection: "required",
      line_items: [
        {
          price: product.price_id,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?txnId=${transaction.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel?txnId=${transaction.id}`,
      metadata: {
        transactionId: transaction.id,
        userId: session.user.id,
        productName: product.name,
        productId: product.id.toString()
      },
    };

    // Add subscription-specific parameters if needed
    if (mode === 'subscription') {
      sessionParams.subscription_data = {
        metadata: {
          transactionId: transaction.id,
          userId: session.user.id,
        },
      };
    }

    // Create the checkout session
    const stripeSession = await stripe.checkout.sessions.create(sessionParams);

    // Update transaction with Stripe session ID if needed
    await prisma.transactions.update({
      where: { id: transaction.id },
      data: {
        status: 1, // You might want to update status to "pending"
      }
    });

    return NextResponse.json({
      message: "Session generated successfully!",
      id: stripeSession.id,
      url: stripeSession.url,
      mode: mode,
    });
  } catch (error) {
    console.error("Error occurred while creating Stripe session:", error);
    
    if (error instanceof Stripe.errors.StripeError) {
      const stripeError = error as Stripe.errors.StripeError;
      return NextResponse.json(
        { 
          message: "Payment service error", 
          error: stripeError.message,
          code: stripeError.code,
          type: stripeError.type,
        },
        { status: stripeError.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error", error: (error as Error).message },
      { status: 500 }
    );
  }
}