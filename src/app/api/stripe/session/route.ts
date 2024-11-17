import { NextRequest, NextResponse } from "next/server";
import { authOptions, CustomSession } from "../../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db.config";
import Stripe from "stripe";

// Interface for the request payload
interface SessionPayload {
  plan: string;
}

export async function POST(req: NextRequest) {
  // Get the session to verify user authentication
  const session: CustomSession | null = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse the request body
    const body: SessionPayload = await req.json();
    
    // Initialize Stripe with the secret key from environment variables
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-10-28.acacia", // Specify the API version
    });

    // Log the Stripe key for debugging (ensure to remove this in production)
    console.log("Stripe Key:", process.env.STRIPE_SECRET_KEY);

    // Get the product from the database
    const product = await prisma.products.findUnique({
      where: {
        name: body.plan,
      },
    });

    // Check if the product exists
    if (!product) {
      return NextResponse.json(
        { message: "No product found. Please check you passed the correct product." },
        { status: 404 }
      );
    }

    // Create a transaction record in the database
    const transaction = await prisma.transactions.create({
      data: {
        user_id: Number(session.user.id!),
        amount: product.amount,
      },
    });

    // Log the transaction for debugging
    console.log("Transaction Created:", transaction);

    // Create a Stripe Checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      currency: "INR",
      billing_address_collection: "required",
      line_items: [
        {
          price: product.price_id, // Ensure this is a valid price ID from Stripe
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.nextUrl.origin}/payment/success?txnId=${transaction.id}`,
      cancel_url: `${req.nextUrl.origin}/payment/cancel?txnId=${transaction.id}`,
    });

    // Return the session ID to the client
    return NextResponse.json({
      message: "Session generated successfully!",
      id: stripeSession.id,
    });
  } catch (error) {
    console.error("Error occurred while creating Stripe session:", error);
    
    // Handle specific errors if needed
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { message: "Stripe API error occurred.", error: error.message },
        { status: 500 }
      );
    }

    // General error response
    return NextResponse.json(
      { message: "Something went wrong. Please try again!" },
      { status: 500 }
    );
  }
}