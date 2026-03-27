"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";

type Person = { name: string; paid: boolean };
type Expense = {
  id: number;
  title: string;
  amount: number;
  paidBy: string;
  people: Person[];
};

export default function Home() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [members, setMembers] = useState("");
  const [loading, setLoading] = useState<number | null>(null);
  const [settled, setSettled] = useState<number[]>([]);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [txHash, setTxHash] = useState<{ [id: number]: string }>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (authenticated && user) {
      const wallet = (user.linkedAccounts as any[])?.find(
        (a) => a.type === "wallet" || a.type === "smart_wallet"
      );
      if (wallet?.address) {
        setWalletAddress(wallet.address);
      } else {
        setWalletAddress("0x0229a0d503a343233aa299cbb8f119321902ba292a276a82ad6fbc2e1c5e56f1");
      }
    }
  }, [authenticated, user]);

  const addExpense = () => {
    if (!title || !amount || !paidBy || !members) return;
    const peopleList = members.split(",").map((m) => m.trim()).filter(Boolean).map((name) => ({ name, paid: false }));
    setExpenses([...expenses, { id: Date.now(), title, amount: parseFloat(amount), paidBy, people: peopleList }]);
    setTitle(""); setAmount(""); setPaidBy(""); setMembers("");
  };

  const settleExpense = async (expenseId: number) => {
    if (!authenticated) { login(); return; }
    setLoading(expenseId);
    try {
      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: "0.001",
          recipientAddress: walletAddress || "0x0229a0d503a343233aa299cbb8f119321902ba292a276a82ad6fbc2e1c5e56f1",
        }),
      });
      const data = await response.json();
      if (data.success && data.txHash) {
        setTxHash((prev) => ({ ...prev, [expenseId]: data.txHash }));
        setSettled((prev) => [...prev, expenseId]);
      } else {
        alert("Transfer failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Network error");
    }
    setLoading(null);
  };

  const totalOwed = expenses.filter((e) => !settled.includes(e.id)).reduce((sum, e) => sum + e.amount, 0);
  const shortAddress = (addr: string) => addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";

  if (!ready || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/50 text-sm animate-pulse">Loading StarkSplit...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-sm sticky top-0 z-10 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-sm font-bold shadow-lg shadow-purple-500/30">S</div>
          <span className="font-bold text-lg tracking-tight">StarkSplit</span>
          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">StarkZap</span>
        </div>
        {authenticated ? (
          <div className="flex items-center gap-3">
            {walletAddress && (
              <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-white/60 font-mono">{shortAddress(walletAddress)}</span>
              </div>
            )}
            <span className="text-xs text-white/40 hidden sm:block">{user?.email?.address}</span>
            <button onClick={logout} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition">Logout</button>
          </div>
        ) : (
          <button onClick={login} className="text-sm bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg transition font-medium">Login</button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Split expenses,<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">settle on-chain.</span>
          </h1>
          <p className="text-white/40 text-sm">Gasless payments via Starknet · No crypto knowledge needed</p>
        </div>

        {authenticated && walletAddress && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/50 uppercase tracking-wider">Your Starknet Wallet</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400">Connected</span>
              </div>
            </div>
            <p className="font-mono text-sm text-white/80 break-all">{walletAddress}</p>
            <div className="flex items-center gap-6 pt-1">
              <div>
                <p className="text-xs text-white/40">Pending</p>
                <p className="text-lg font-bold text-red-400">${totalOwed.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Settled</p>
                <p className="text-lg font-bold text-green-400">{settled.length} txs</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Network</p>
                <p className="text-sm font-semibold text-purple-300">Starknet Sepolia</p>
              </div>
            </div>
          </div>
        )}

        {!authenticated && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto text-2xl">🔐</div>
            <div>
              <p className="font-semibold">Login to get started</p>
              <p className="text-white/50 text-sm mt-1">Your Starknet wallet is created automatically. No seed phrase needed.</p>
            </div>
            <button onClick={login} className="bg-purple-600 hover:bg-purple-500 transition px-8 py-3 rounded-xl text-sm font-semibold">Login with Email or Google</button>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-white/70 text-sm uppercase tracking-wider">New Expense</h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20 focus:outline-none focus:border-purple-500 transition" placeholder="Title (e.g. Dinner)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20 focus:outline-none focus:border-purple-500 transition" placeholder="Amount (STRK)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20 focus:outline-none focus:border-purple-500 transition" placeholder="Paid by (e.g. Mehmet)" value={paidBy} onChange={(e) => setPaidBy(e.target.value)} />
          <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20 focus:outline-none focus:border-purple-500 transition" placeholder="Split with: Ali, Ayse, Fatma" value={members} onChange={(e) => setMembers(e.target.value)} />
          <button onClick={addExpense} className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 transition rounded-xl py-3 text-sm font-semibold shadow-lg shadow-purple-500/20">+ Add Expense</button>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center text-white/20 text-sm py-8 space-y-2">
            <p className="text-3xl">💸</p>
            <p>No expenses yet. Add one above</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-semibold text-white/50 text-xs uppercase tracking-wider">Expenses ({expenses.length})</h2>
            {expenses.map((exp) => {
              const perPerson = (exp.amount / (exp.people.length + 1)).toFixed(2);
              const isSettled = settled.includes(exp.id);
              const isLoading = loading === exp.id;
              const hash = txHash[exp.id];
              const settledClass = "bg-green-500/5 border-green-500/20";
              const defaultClass = "bg-white/5 border-white/10";
              const btnSettled = "bg-green-500/20 text-green-400 cursor-default";
              const btnLoading = "bg-purple-500/30 text-purple-300 cursor-wait";
              const btnDefault = "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/20";
              return (
                <div key={exp.id} className={"border rounded-2xl p-5 space-y-4 transition-all duration-500 " + (isSettled ? settledClass : defaultClass)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold capitalize">{exp.title}</p>
                      <p className="text-white/40 text-xs mt-0.5">Paid by {exp.paidBy}</p>
                    </div>
                    <div className="text-right">
                      <p className={"text-2xl font-bold " + (isSettled ? "text-green-400" : "text-purple-400")}>${exp.amount}</p>
                      <p className="text-white/30 text-xs">${perPerson} / person</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {exp.people.map((p) => (
                      <span key={p.name} className={"text-xs px-3 py-1 rounded-full " + (isSettled ? "bg-green-500/10 text-green-300" : "bg-white/10 text-white/60")}>
                        {p.name} owes ${perPerson}
                      </span>
                    ))}
                  </div>
                  {isSettled && hash && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
                      <p className="text-xs text-green-400/60 mb-0.5">Transaction Hash</p>
                      <p className="font-mono text-xs text-green-300 break-all">{hash}</p>
                    </div>
                  )}
                  <button
                    onClick={() => settleExpense(exp.id)}
                    disabled={isSettled || isLoading}
                    className={"w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 " + (isSettled ? btnSettled : isLoading ? btnLoading : btnDefault)}
                  >
                    {isSettled ? "Settled on Starknet" : isLoading ? "Broadcasting via StarkZap..." : authenticated ? "Settle Gasless via StarkZap" : "Login to Settle"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-center text-white/15 text-xs pb-4">Built with StarkZap SDK · Powered by Starknet Sepolia · Gasless via AVNU Paymaster</p>
      </div>
    </main>
  );
}
