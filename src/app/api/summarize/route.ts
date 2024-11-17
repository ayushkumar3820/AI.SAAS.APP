/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { loadSummarizationChain } from "langchain/chains";
import { TokenTextSplitter } from "langchain/text_splitter";
import { PromptTemplate } from "@langchain/core/prompts";
import { summaryTemplate } from "@/lib/prompts";
import { gptModal } from "@/lib/langchain";
import { getServerSession } from "next-auth";
import { authOptions, CustomSession } from "../auth/[...nextauth]/options";
import { getUserCoins } from "@/actions/fetchActions";
import { coinsSpend, minusCoins, updateSummary } from "@/actions/commonActions";
import prisma from "@/lib/db.config";

// Interface for request payload
interface SummarizePayload {
  url: string;
  id: string;
}

// Function to validate YouTube URL
const validateUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname.includes("youtube.com") || parsedUrl.hostname.includes("youtu.be")
    );
  } catch {
    return false;
  }
};

// Retry logic for API requests
const retryRequest = async (fn: Function, retries: number = 3, delay: number = 5000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) {
      throw error;
    }
    
    if (error?.message?.includes("quota") || error?.message?.includes("rate limit")) {
      console.log(`Quota exceeded, retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
      return retryRequest(fn, retries - 1, delay * 2); // Exponentially increase the delay for next retry
    }
    throw error; // If error is not related to quota, rethrow it
  }
};

export async function POST(req: NextRequest) {
  try {
    const body: SummarizePayload = await req.json();

    // Validate input
    if (!body.url || !body.id) {
      return NextResponse.json(
        { message: "URL and ID are required." },
        { status: 400 }
      );
    }

    if (!validateUrl(body.url)) {
      return NextResponse.json(
        { message: "Invalid YouTube URL." },
        { status: 400 }
      );
    }

    // Authentication check
    const session: CustomSession | null = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    // Check user coins
    const userCoins = await getUserCoins(session.user.id!);
    if (!userCoins?.coins || userCoins.coins < 10) {
      return NextResponse.json(
        {
          message: "Insufficient coins. You need at least 10 coins.",
          currentCoins: userCoins?.coins || 0,
          requiredCoins: 10,
        },
        { status: 400 }
      );
    }

    // Check for existing summary
    const oldSummary = await prisma.summary.findFirst({
      select: { response: true, created_at: true },
      where: { url: body.url },
    });

    if (oldSummary?.response) {
      await minusCoins(session.user.id!);
      await coinsSpend(session.user.id!, body.id);
      return NextResponse.json({
        message: "Cached summary retrieved.",
        data: oldSummary.response,
        cached: true,
        timestamp: oldSummary.created_at,
      });
    }

    // Extract YouTube transcript
    const loader = YoutubeLoader.createFromUrl(body.url, {
      language: "en",
      addVideoInfo: true,
    });

    const text = await loader.load();
    if (!text.length) {
      return NextResponse.json(
        { message: "No transcript available for this video." },
        { status: 404 }
      );
    }

    // Split text into chunks
    const splitter = new TokenTextSplitter({ chunkSize: 15000, chunkOverlap: 250 });
    const docsSummary = await splitter.splitDocuments(text);

    // Generate summary using retry logic
    const summaryPrompt = PromptTemplate.fromTemplate(summaryTemplate);
    const summaryChain = loadSummarizationChain(gptModal, {
      type: "map_reduce",
      verbose: true,
      combinePrompt: summaryPrompt,
    });

    // Retry API request in case of rate limit or quota exceeded
    const res = await retryRequest(() => summaryChain.invoke({ input_documents: docsSummary }));

    // Update transactions and summary record
    await Promise.all([ 
      minusCoins(session.user.id!),
      coinsSpend(session.user.id!, body.id),
      updateSummary(body.id, res?.text),
    ]);

    return NextResponse.json({
      message: "Summary generated successfully.",
      data: res?.text,
    });
  } catch (error: any) {
    console.error("Error:", error);

    // Handle specific errors
    if (error.message?.includes("quota")) {
      return NextResponse.json(
        { message: "API quota exceeded. Try again later.", error: "QUOTA_EXCEEDED" },
        { status: 429 }
      );
    }

    if (error.message?.includes("timeout")) {
      return NextResponse.json(
        { message: "Request timed out. Try a shorter video.", error: "TIMEOUT" },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { message: "An error occurred while processing your request.", error: error.message },
      { status: 500 }
    );
  }
}
