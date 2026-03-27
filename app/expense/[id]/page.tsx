"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useParams } from "next/navigation";

type Member = { name: string; paid: boolean };
type Expense = {
  id: string;
  title: string;
  amount: number;
  paid_by: string;
  created_by: string;
  members: Member[];
  settled: boolean;
  tx_hash: string | null;
  created_at: string;
};

export default function ExpensePage() {
  const { ready, authenticated, login, user } = usePrivy();
  const params = useParams();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetch("/api/expenses?id=" + params.id)
        .then((r) => r.json())
        .then((data) => {
          setExpense(data.expense);
          setLoading(false);
        });
    }
  }, [params.id]);

  const payMyShare = async () => {
    if (!authenticated) { login(); return; }
    setPaying(true);
    try {
      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: "0.001", recipientAddress: expense?.created_by }),
      });
      const data = await response.json();
      if (data.success && data.txHash) {
        setTxHash(data.txHash);
        setPaid(true);
      }
    } catch (err) {
      alert("Payment failed");
    }
    setPaying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-white animate-pulse">Loading expense...</p>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-white">Expense not found.</p>
      </div>
    );
  }

  const perPerson = (expense.amount / (expense.members.length + 1)).toFixed(2);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3 bg-black/20">
        <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center font-bold">S</div>
        <span className="font-bold">StarkSplit</span>
        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">StarkZap</span>
      </div>

      <div className="max-w-lg mx-auto px-6 py-10 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-white/40 text-sm">You have been invited to pay</p>
          <h1 className="text-3xl font-bold capitalize">{expense.title}</h1>
          <p className="text-white/40 text-sm">Paid by {expense.paid_by}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-white/60">Total amount</p>
            <p className="text-2xl font-bold text-purple-400">${expense.amount}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-white/60">Your share</p>
            <p className="text-xl font-bold text-white">${perPerson}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-white/60">Split between</p>
            <p className="text-white">{expense.members.length + 1} people</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {expense.members.map((m) => (
            <span key={m.name} className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/60">
              {m.name}
            </span>
          ))}
        </div>

        {paid && txHash ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 space-y-2 text-center">
            <p className="text-green-400 font-semibold text-lg">Payment sent!</p>
            <p className="text-xs text-white/40">Transaction Hash</p>
            <p className="font-mono text-xs text-green-300 break-all">{txHash}</p>
          </div>
        ) : (
          <button
            onClick={payMyShare}
            disabled={paying}
            className={"w-full py-4 rounded-xl font-semibold transition " + (paying ? "bg-purple-500/30 text-purple-300 cursor-wait" : "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400")}
          >
            {paying ? "Sending payment via StarkZap..." : authenticated ? "Pay $" + perPerson + " via StarkZap" : "Login to Pay"}
          </button>
        )}

        <p className="text-center text-white/20 text-xs">Gasless payment via Starknet · Built with StarkZap SDK</p>
      </div>
    </main>
  );
}
