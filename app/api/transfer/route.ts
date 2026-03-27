import { NextResponse } from "next/server";
import { StarkZap, StarkSigner, OnboardStrategy, Amount, sepoliaTokens, fromAddress } from "starkzap";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const recipientAddress = body.recipientAddress || "0x0229a0d503a343233aa299cbb8f119321902ba292a276a82ad6fbc2e1c5e56f1";
    const transferAmount = body.amount || "0.001";

    const privateKey = process.env.TEST_PRIVATE_KEY!;
    const sdk = new StarkZap({ network: "sepolia" });

    const { wallet } = await sdk.onboard({
      strategy: OnboardStrategy.Signer,
      account: { signer: new StarkSigner(privateKey) },
      deploy: "if_needed",
    });

    const STRK = sepoliaTokens.STRK;
    const balance = await wallet.balanceOf(STRK);

    // Gerçek STRK transferi
    const tx = await wallet.transfer(STRK, [
      {
        to: fromAddress(recipientAddress),
        amount: Amount.parse(transferAmount, STRK),
      },
    ]);

    await tx.wait();

    return NextResponse.json({
      success: true,
      walletAddress: wallet.address,
      balance: balance.toFormatted(),
      txHash: tx.hash,
      amount: transferAmount,
      recipient: recipientAddress,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}